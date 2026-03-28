import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { getWebsiteLimits, canUseTemplate } from '@/lib/websitePlans'
import { getDefaultWebsite } from '@/lib/websiteDefault'

// GET — fetch website config + plan limits
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const school = await School.findById(session.user.tenantId).lean() as any
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const website = school.website || getDefaultWebsite({
      name: school.name, address: school.address,
      phone: school.phone, email: school.email,
    })

    // Send plan limits along with website data
    const plan = session.user.plan || school.plan || 'starter'
    const limits = getWebsiteLimits(plan)

    return NextResponse.json({
      website,
      school: {
        name: school.name,
        subdomain: school.subdomain,
        address: school.address,
        phone: school.phone,
        email: school.email,
        logo: school.logo,
      },
      plan,
      limits,
      previewUrl: `/website/${school.subdomain}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT — save website config with plan validation
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await req.json()
    const { action, website: websiteData } = body

    const school = await School.findById(session.user.tenantId)
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const plan = session.user.plan || school.plan || 'starter'
    const limits = getWebsiteLimits(plan)

    // ── No action = direct save ──
    if (!action) {
      if (!websiteData) {
        return NextResponse.json({ error: 'No data provided' }, { status: 400 })
      }

      // ── Plan-based validations ──
      // Template check
      if (websiteData.template && !canUseTemplate(plan, websiteData.template)) {
        websiteData.template = limits.allowedTemplates[0]
      }

      // Gallery limit
      if (websiteData.gallery && websiteData.gallery.length > limits.maxGalleryPhotos) {
        websiteData.gallery = websiteData.gallery.slice(0, limits.maxGalleryPhotos)
      }

      // Custom pages limit
      if (websiteData.pages) {
        const customPages = websiteData.pages.filter((p: any) => !p.isSystem)
        if (customPages.length > limits.maxCustomPages) {
          // Keep only allowed number of custom pages
          let customCount = 0
          websiteData.pages = websiteData.pages.filter((p: any) => {
            if (p.isSystem) return true
            customCount++
            return customCount <= limits.maxCustomPages
          })
        }
      }

      // Remove branding only for enterprise
      if (!limits.removeBranding) {
        // Ensure branding stays
      }

      await School.findByIdAndUpdate(
        session.user.tenantId,
        { $set: { website: websiteData } },
        { new: true }
      )

      return NextResponse.json({
        success: true,
        message: websiteData.isPublished ? 'Website published!' : 'Website saved!',
      })
    }

    // ── Action-based operations ──
    if (!school.website) {
      school.website = getDefaultWebsite({
        name: school.name, address: school.address,
        phone: school.phone, email: school.email,
      }) as any
    }

    switch (action) {
      case 'saveAll': {
        school.website = websiteData
        school.markModified('website')
        await school.save()
        return NextResponse.json({ success: true })
      }

      case 'publish': {
        school.website!.isPublished = true
        school.markModified('website')
        await school.save()
        return NextResponse.json({ success: true, message: 'Website published!' })
      }

      case 'unpublish': {
        school.website!.isPublished = false
        school.markModified('website')
        await school.save()
        return NextResponse.json({ success: true })
      }

      case 'addPage': {
        const { page } = body
        const customPages = (school.website!.pages as any[]).filter((p: any) => !p.isSystem)
        if (customPages.length >= limits.maxCustomPages) {
          return NextResponse.json(
            { error: `Your ${plan} plan allows only ${limits.maxCustomPages} custom pages. Upgrade to add more.` },
            { status: 403 }
          )
        }
        school.website!.pages.push(page)
        school.markModified('website')
        await school.save()
        return NextResponse.json({ success: true })
      }

      case 'deletePage': {
        const { pageId } = body
        const currentPages = school.website!.pages as any[]
        school.website!.pages = currentPages.filter((p: any) => p.id !== pageId) as any
        school.markModified('website')
        await school.save()
        return NextResponse.json({ success: true })
      }

      case 'updateDomain': {
        if (!limits.customDomain) {
          return NextResponse.json(
            { error: 'Custom domain is not available in your plan. Upgrade to Pro or Enterprise.' },
            { status: 403 }
          )
        }
        const { customDomain } = body
        school.website!.customDomain = customDomain
        school.website!.domainVerified = false
        school.markModified('website')
        await school.save()
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (err: any) {
    console.error('Website API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}