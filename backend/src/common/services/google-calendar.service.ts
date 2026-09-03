import { google } from 'googleapis';
import { logger } from '@/common/utils/logger.util';

export class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private oauth2Client: any;
  private isConfigured: boolean = false;

  private constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    // Use the OAuth Playground redirect URI since the refresh token was generated there
    const redirectUri = 'https://developers.google.com/oauthplayground';

    if (clientId && clientSecret && refreshToken) {
      try {
        this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        this.oauth2Client.setCredentials({
          refresh_token: refreshToken,
        });
        this.isConfigured = true;
        logger.info('✓ Google OAuth2 client initialized successfully for Google Calendar API');
      } catch (err) {
        logger.error('Failed to initialize Google OAuth2 client:', err);
      }
    } else {
      logger.warn('⚠ Google Calendar API credentials missing in .env. Meet link generation will not work.');
      if (!clientId) logger.warn('  Missing: GOOGLE_CLIENT_ID');
      if (!clientSecret) logger.warn('  Missing: GOOGLE_CLIENT_SECRET');
      if (!refreshToken) logger.warn('  Missing: GOOGLE_REFRESH_TOKEN');
    }
  }

  public static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  /**
   * Creates a Google Meet meeting via Google Calendar API.
   * Throws an error if credentials are missing or API call fails.
   */
  public async createGoogleMeetLink(
    studentEmail: string,
    mentorEmail: string,
    topic: string,
    dateStr: string,
    timeSlot: string
  ): Promise<string> {
    if (!this.isConfigured || !this.oauth2Client) {
      throw new Error('Google Calendar API is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in .env');
    }

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    // Combine Date (YYYY-MM-DD) and Time Slot (e.g. "04:00 PM")
    const timeMatch = timeSlot.match(/(\d+):(\d+)\s*(AM|PM)/i);
    let hours = 11;
    let minutes = 0;
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }

    const scheduledDate = new Date(dateStr);
    scheduledDate.setHours(hours, minutes, 0, 0);

    const endLimit = new Date(scheduledDate.getTime() + 45 * 60 * 1000); // 45 mins session

    const event = {
      summary: `Doubt Session: ${topic}`,
      description: 'GrowthCraft 1-on-1 Mentor Doubt Session',
      start: {
        dateTime: scheduledDate.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endLimit.toISOString(),
        timeZone: 'UTC',
      },
      attendees: [
        { email: studentEmail },
        { email: mentorEmail },
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
    };

    logger.info(`Creating Google Calendar event with attendees: ${studentEmail}, ${mentorEmail}`);

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: 1,
      });

      const entryPoints = response.data.conferenceData?.entryPoints;
      const meetingLink = entryPoints?.[0]?.uri;

      if (meetingLink) {
        logger.info(`✓ Successfully created Google Meet link via API: ${meetingLink}`);
        return meetingLink;
      } else {
        throw new Error('Google Calendar event was created but no Meet link was returned in the response.');
      }
    } catch (err: any) {
      // Log the FULL error details for debugging
      logger.error('❌ Google Calendar API Error:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data ? JSON.stringify(err.response.data) : undefined,
        code: err.code,
      });
      throw new Error(`Google Calendar API failed: ${err.response?.data?.error || err.message}`);
    }
  }
}

export const googleCalendarService = GoogleCalendarService.getInstance();
