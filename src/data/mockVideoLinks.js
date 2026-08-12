export const supportedPlatforms = [
  'WebEx',
  'Zoom',
  'Google Meet',
  'Microsoft Teams',
  'Other'
];

export const mockVideoLinks = [
  {
    id: 'vl1',
    caseNumber: 'Crl. Appeal 45/2024',
    caseTitle: 'Ramesh Sharma v. State of Maharashtra',
    court: 'Bombay High Court',
    platform: 'Zoom',
    meetingLink: 'https://zoom.us/j/1234567890',
    meetingId: '123-456-7890',
    passcode: '123456',
    hearingDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    notes: 'Bail hearing'
  },
  {
    id: 'vl2',
    caseNumber: 'LPA 123/2024',
    caseTitle: 'Priya Enterprises v. Union of India',
    court: 'Supreme Court of India',
    platform: 'Microsoft Teams',
    meetingLink: 'https://teams.microsoft.com/l/meetup-join/19:meeting_abc123@thread.v2',
    meetingId: 'abc123',
    passcode: '',
    hearingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '14:30',
    notes: 'Final hearing'
  },
  {
    id: 'vl3',
    caseNumber: 'WP 789/2023',
    caseTitle: 'Sunita Verma v. Municipal Corporation',
    court: 'Delhi High Court',
    platform: 'WebEx',
    meetingLink: 'https://delhihighcourt.webex.com/delhihighcourt/j.php?MTID=xyz789',
    meetingId: '9876543210',
    passcode: 'DelhiHC2024',
    hearingDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '11:00',
    notes: 'Order reserved'
  }
];
