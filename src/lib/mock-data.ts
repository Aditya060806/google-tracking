// Placeholder organizers for the About page. Replace them with the real team.
// Campaign data (syllabus, participants, teams) lives in src/config/campaign.json
// and src/data/leaderboard.json.

export type Organizer = {
  name: string;
  role: string;
  avatar: string;
  links: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  }
}

export const organizers: Organizer[] = [
    { name: 'Alex Doe', role: 'GDG Organizer', avatar: 'organizer-1', links: { twitter: '#', linkedin: '#', github: '#' } },
    { name: 'Jane Smith', role: 'Core Team Member', avatar: 'organizer-2', links: { twitter: '#', linkedin: '#' } },
    { name: 'Sam Wilson', role: 'Core Team Member', avatar: 'organizer-3', links: { github: '#' } },
    { name: 'Maria Garcia', role: 'Core Team Member', avatar: 'organizer-4', links: { linkedin: '#' } },
    { name: 'David Lee', role: 'Core Team Member', avatar: 'organizer-5', links: { twitter: '#', github: '#' } },
    { name: 'Emily White', role: 'Core Team Member', avatar: 'organizer-6', links: { linkedin: '#' } },
    { name: 'Chris Green', role: 'Core Team Member', avatar: 'organizer-7', links: { twitter: '#', linkedin: '#', github: '#' } },
    { name: 'Sarah Brown', role: 'Core Team Member', avatar: 'organizer-8', links: { github: '#' } },
    { name: 'Michael Clark', role: 'Core Team Member', avatar: 'organizer-9', links: { linkedin: '#', github: '#' } },
    { name: 'Jessica Taylor', role: 'Core Team Member', avatar: 'organizer-10', links: { twitter: '#' } },
    { name: 'Daniel Martinez', role: 'Core Team Member', avatar: 'organizer-11', links: { github: '#' } },
    { name: 'Laura Rodriguez', role: 'Core Team Member', avatar: 'organizer-12', links: { linkedin: '#' } },
    { name: 'Kevin Hernandez', role: 'Core Team Member', avatar: 'organizer-13', links: { twitter: '#', linkedin: '#' } },
    { name: 'Nancy Gonzalez', role: 'Core Team Member', avatar: 'organizer-14', links: { github: '#' } },
    { name: 'Paul Perez', role: 'Core Team Member', avatar: 'organizer-15', links: { twitter: '#', github: '#' } },
];
