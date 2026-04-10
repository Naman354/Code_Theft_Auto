# Anti-Cheat and Device Management Implementation Plan

This plan outlines the implementation of a 2-device login limit, tab-switching detection with automatic logout, and permanent team disqualification after 3 violations.

## Proposed Changes

### Database & Models

#### [MODIFY] [models/Team.ts](file:///c:/Users/lavva/OneDrive/Desktop/code-theft-auto/models/Team.ts)
- Add `isDisqualified: boolean` (default: `false`).
- Add `tabSwitchCount: number` (default: `0`).
- Add `activeSessions: { sessionId: string, lastActive: Date }[]` (to track and limit devices).

### Authentication & Sessions

#### [MODIFY] [lib/team-session.ts](file:///c:/Users/lavva/OneDrive/Desktop/code-theft-auto/lib/team-session.ts)
- Update session payload to include a unique `sessionId` (UUID).
- Implement `validateTeamSession(teamId, sessionId)` to check if:
  - The team is disqualified.
  - The session exists in the `activeSessions` list.

#### [MODIFY] [app/api/auth/login/route.ts](file:///c:/Users/lavva/OneDrive/Desktop/code-theft-auto/app/api/auth/login/route.ts)
- Block login if `isDisqualified` is `true`.
- Check `activeSessions.length`. If `>= 2`, prevent login with a "Device limit reached" error.
- Generate a new `sessionId` and add it to `activeSessions`.

### Monitoring & Enforcement

#### [NEW] [app/api/team/tab-switch/route.ts](file:///c:/Users/lavva/OneDrive/Desktop/code-theft-auto/app/api/team/tab-switch/route.ts)
- Endpoint to report a tab switch.
- Increments `tabSwitchCount`.
- If `tabSwitchCount >= 3`, sets `isDisqualified = true`.
- Removes the current `sessionId` from `activeSessions` (triggers logout effect).

#### [NEW] [components/AntiCheat.tsx](file:///c:/Users/lavva/OneDrive/Desktop/code-theft-auto/components/AntiCheat.tsx)
- Use `useEffect` to listen for the `visibilitychange` event.
- When `document.visibilityState === 'hidden'`:
  - Call the `/api/team/tab-switch` endpoint.
  - Redirect the user to the login/landing page with a warning query parameter (e.g., `?warning=tab_switched`).
- Periodically check team status (heartbeat) to detect remote DQ or session invalidation.

### Integration & UI

#### [MODIFY] [app/dashboard/page.tsx](file:///c:/Users/lavva/OneDrive/Desktop/code-theft-auto/app/dashboard/page.tsx) & [app/dashboard/mission/page.tsx](file:///c:/Users/lavva/OneDrive/Desktop/code-theft-auto/app/dashboard/mission/page.tsx)
- Include the `<AntiCheat />` component to enable protection on these pages.

#### [NEW] [app/disqualified/page.tsx](file:///c:/Users/lavva/OneDrive/Desktop/code-theft-auto/app/disqualified/page.tsx)
- A dedicated page to show when a team is permanently disqualified.

## User Review Required

> [!IMPORTANT]
> **Logout Behavior**: Switching tabs will trigger an **immediate logout**. The user will need to log back in (unless they have reached 3 switches).
> **Device Identification**: This implementation treats each "authenticated session" as a device. If a user logs in on Chrome and then on Edge on the same computer, it counts as 2 devices.

## Open Questions

1. **Warning Message**: Would you like the warning to appear as a popup *before* logging out, or is a message on the login screen sufficient?
2. **Tab Switching Definition**: Should we also detect "window blur" (focusing another application) or strictly "tab switching" (hiding the page)?
3. **Admin Controls**: Do you need a way for admins to reset a team's switch count or lift a disqualification?

## Verification Plan

### Automated/Manual Tests
- **Device Limit**: Login on 2 browsers (or Incognito). Attempt login on a 3rd. Expect failure.
- **Tab Switching**: Open the dashboard, switch to another tab. Expect redirection to login with a warning.
- **Disqualification**: Repeat tab switching 3 times. Verify that the team cannot login anymore and sees the DQ screen.
- **Direct Access**: Attempt to visit `/dashboard` directly after DQ. Expect redirect to `/disqualified`.
