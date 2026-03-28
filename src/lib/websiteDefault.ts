import type { IWebsiteConfig, IWebsitePage } from '@/models/School'

// Generate unique IDs
const uid = () => Math.random().toString(36).slice(2, 10)

export function getDefaultPages(): IWebsitePage[] {
  return [
    {
      id: uid(),
      title: 'Home',
      slug: 'home',
      isSystem: true,
      enabled: true,
      order: 0,
      sections: [
        { id: uid(), type: 'hero', title: 'Hero Banner', enabled: true, order: 0, content: {} },
        { id: uid(), type: 'stats', title: 'School Stats', enabled: true, order: 1, content: {} },
        { id: uid(), type: 'about', title: 'About Us', enabled: true, order: 2, content: {} },
        { id: uid(), type: 'facilities', title: 'Our Facilities', enabled: true, order: 3, content: {} },
        { id: uid(), type: 'cta', title: 'Admission CTA', enabled: true, order: 4, content: {} },
      ],
    },
    {
      id: uid(),
      title: 'About Us',
      slug: 'about',
      isSystem: true,
      enabled: true,
      order: 1,
      sections: [
        { id: uid(), type: 'about', title: 'About School', enabled: true, order: 0, content: {} },
        { id: uid(), type: 'stats', title: 'Stats', enabled: true, order: 1, content: {} },
        { id: uid(), type: 'testimonials', title: 'Testimonials', enabled: true, order: 2, content: {} },
      ],
    },
    {
      id: uid(),
      title: 'Academics',
      slug: 'academics',
      isSystem: true,
      enabled: true,
      order: 2,
      sections: [
        { id: uid(), type: 'academics', title: 'Academic Programs', enabled: true, order: 0, content: {} },
        { id: uid(), type: 'faculty', title: 'Our Faculty', enabled: true, order: 1, content: {} },
      ],
    },
    {
      id: uid(),
      title: 'Admissions',
      slug: 'admissions',
      isSystem: true,
      enabled: true,
      order: 3,
      sections: [
        { id: uid(), type: 'custom', title: 'Admission Process', enabled: true, order: 0, content: {
          heading: 'Admissions Open',
          body: 'We welcome applications for the new academic session. Please contact the school office for admission forms and details.',
          items: ['Application Form', 'Previous Report Card', 'Birth Certificate', 'Passport Photos', 'Address Proof'],
        }},
        { id: uid(), type: 'cta', title: 'Apply Now', enabled: true, order: 1, content: {} },
      ],
    },
    {
      id: uid(),
      title: 'Gallery',
      slug: 'gallery',
      isSystem: true,
      enabled: true,
      order: 4,
      sections: [
        { id: uid(), type: 'gallery', title: 'Photo Gallery', enabled: true, order: 0, content: {} },
      ],
    },
    {
      id: uid(),
      title: 'Events',
      slug: 'events',
      isSystem: true,
      enabled: true,
      order: 5,
      sections: [
        { id: uid(), type: 'events', title: 'Events & News', enabled: true, order: 0, content: {} },
      ],
    },
    {
      id: uid(),
      title: 'Contact',
      slug: 'contact',
      isSystem: true,
      enabled: true,
      order: 6,
      sections: [
        { id: uid(), type: 'contact', title: 'Contact Us', enabled: true, order: 0, content: {} },
      ],
    },
  ]
}

export function getDefaultWebsite(school: { name: string; address: string; phone: string; email: string }): Partial<IWebsiteConfig> {
  return {
    template: 'modern',
    isPublished: false,
    primaryColor: '#4F46E5',
    secondaryColor: '#10B981',
    tagline: 'Excellence in Education',
    about: `${school.name} is committed to providing quality education and holistic development of students. We nurture young minds to become responsible citizens and future leaders.`,
    address: school.address || '',
    phone: school.phone || '',
    email: school.email || '',
    admissionOpen: false,
    pages: getDefaultPages(),
    stats: [
      { label: 'Students', value: '500+' },
      { label: 'Teachers', value: '25+' },
      { label: 'Years', value: '10+' },
      { label: 'Activities', value: '20+' },
    ],
    facilities: [
      'Smart Classrooms',
      'Science Laboratory',
      'Computer Lab',
      'Library',
      'Sports Ground',
      'Auditorium',
    ],
    gallery: [],
    faculty: [],
    testimonials: [],
    events: [],
  }
}