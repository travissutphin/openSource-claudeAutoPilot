# Product Requirements Document: TaskFlow

## Overview

TaskFlow is a lightweight task management SaaS for small remote teams (2-10 people). It provides shared kanban boards with real-time collaboration, designed for teams who find Jira too complex and Trello too limited.

**Target Launch**: MVP in 4 weeks

---

## Goals

1. **Simplicity** - Usable without training or documentation
2. **Real-time** - See teammate updates instantly
3. **Affordable** - Free tier for small teams, $5/user/month for premium
4. **Fast** - Page loads under 1 second

---

## Target Users

**Primary**: Small startup teams (2-10 people)
- Non-technical founders managing development
- Freelancers collaborating with clients
- Small agencies managing projects

**User Persona - "Sarah"**:
- Runs a 5-person marketing agency
- Currently uses spreadsheets and Slack
- Needs visibility into who's working on what
- Doesn't want to learn complex software

---

## User Stories

### Authentication
- As a user, I want to sign up with email so I can create an account
- As a user, I want to log in with email/password so I can access my teams
- As a user, I want to reset my password so I can recover my account
- As a user, I want to log in with Google so I can sign up faster

### Team Management
- As a user, I want to create a team so I can collaborate with others
- As a team owner, I want to invite members by email so they can join
- As a team owner, I want to set member roles (admin/member) so I can control permissions
- As a user, I want to leave a team so I'm no longer a member

### Boards
- As a team member, I want to create boards so I can organize work by project
- As a team member, I want to add columns to boards so I can define workflow stages
- As a team member, I want to rename/reorder columns so I can customize workflow
- As a team member, I want to archive boards so I can clean up completed projects

### Tasks
- As a team member, I want to create tasks so I can track work items
- As a team member, I want to assign tasks to members so responsibility is clear
- As a team member, I want to add due dates so deadlines are visible
- As a team member, I want to add descriptions so task details are captured
- As a team member, I want to drag tasks between columns so I can update status
- As a team member, I want to add comments so I can discuss task details

### Real-time
- As a team member, I want to see updates instantly so I don't have to refresh
- As a team member, I want to see who's online so I know who's available
- As a team member, I want to see who's viewing a board so I avoid conflicts

---

## Features

### Feature 1: User Authentication
**Priority**: P0 (Must Have)

**Description**: Email/password and Google OAuth authentication with session management.

**Acceptance Criteria**:
- User can sign up with email and password
- Email verification required before first login
- Password requirements: 8+ chars, 1 number, 1 uppercase
- Google OAuth as alternative signup/login
- Sessions persist for 30 days with "remember me"
- Password reset via email link (expires in 1 hour)

**Technical Notes**:
- Use NextAuth.js for authentication
- JWT tokens for session management
- Rate limiting on auth endpoints (5 attempts per minute)

---

### Feature 2: Team Management
**Priority**: P0 (Must Have)

**Description**: Create teams and invite members to collaborate.

**Acceptance Criteria**:
- User can create unlimited teams (free tier: 1 team)
- Team has name (required) and description (optional)
- Invite members via email (sends invitation link)
- Invitation links expire after 7 days
- Roles: Owner (1 per team), Admin, Member
- Owners can delete team, Admins can manage members, Members can edit content
- Members can leave team (owners must transfer ownership first)

**Technical Notes**:
- Team invite codes are UUID v4
- Soft delete for teams (retain data 30 days)

---

### Feature 3: Kanban Boards
**Priority**: P0 (Must Have)

**Description**: Create and manage kanban boards for projects.

**Acceptance Criteria**:
- Create boards with name and optional description
- Default columns: To Do, In Progress, Done
- Add/rename/delete/reorder columns
- Drag-and-drop column reordering
- Board settings: visibility (team-only), color theme
- Archive boards (can be restored within 30 days)

**Technical Notes**:
- Use dnd-kit for drag and drop
- Optimistic UI updates with rollback on error

---

### Feature 4: Tasks
**Priority**: P0 (Must Have)

**Description**: Create and manage tasks within boards.

**Acceptance Criteria**:
- Create task with title (required)
- Optional: description (markdown), due date, assignee, labels
- Drag tasks between columns
- Drag to reorder within column
- Quick edit (click title to edit inline)
- Full edit modal for all fields
- Delete task (soft delete, 30-day retention)
- Task comments with @mentions

**Technical Notes**:
- Rich text editor for descriptions (TipTap or similar)
- Real-time sync via WebSocket

---

### Feature 5: Real-time Collaboration
**Priority**: P1 (Should Have)

**Description**: Live updates when teammates make changes.

**Acceptance Criteria**:
- See task moves/edits instantly (no refresh needed)
- Presence indicators (green dot = online)
- "X is viewing this board" indicator
- Cursor positions shown when editing same task (conflict prevention)
- Offline indicator when connection lost
- Auto-reconnect with sync

**Technical Notes**:
- Use Supabase Realtime or Socket.io
- Optimistic updates with conflict resolution

---

### Feature 6: Notifications
**Priority**: P1 (Should Have)

**Description**: Notify users of relevant activity.

**Acceptance Criteria**:
- Email notifications: task assigned, mentioned in comment, due date approaching
- In-app notification center (bell icon)
- Notification preferences per type
- Daily digest option (instead of immediate emails)

**Technical Notes**:
- Use Resend for transactional email
- Queue notifications (don't block request)

---

### Feature 7: Billing (Premium)
**Priority**: P2 (Nice to Have for MVP)

**Description**: Stripe integration for premium tier.

**Acceptance Criteria**:
- Free tier: 1 team, 3 boards, 100 tasks
- Premium: $5/user/month, unlimited everything
- Upgrade flow in app
- Billing portal for subscription management
- 14-day free trial of premium

**Technical Notes**:
- Stripe Checkout for payments
- Stripe Customer Portal for management
- Webhooks for subscription status

---

## Technical Requirements

### Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Real-time**: Supabase Realtime
- **Email**: Resend
- **Payments**: Stripe
- **Hosting**: Vercel

### Performance
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Lighthouse score: > 90

### Security
- HTTPS everywhere
- CSRF protection
- Rate limiting on all endpoints
- Input sanitization
- SQL injection prevention (Prisma handles)

---

## Out of Scope (v1)

- Mobile apps (web-only for MVP)
- Integrations (Slack, GitHub, etc.)
- Time tracking
- Gantt charts / timeline view
- File attachments
- Custom fields
- API for third-party apps
- Single Sign-On (SSO)
- Audit logs

---

## Success Metrics

- 100 teams signed up in first month
- 50% of teams create 2+ boards
- < 5% churn in first 3 months
- NPS > 40

---

## Timeline

| Week | Milestone |
|------|-----------|
| 1 | Auth + Team Management |
| 2 | Boards + Tasks (core CRUD) |
| 3 | Real-time + Polish |
| 4 | Testing + Launch |

---

## Appendix

### Database Schema (High-Level)

```
User
  - id, email, name, avatar, password_hash, created_at

Team
  - id, name, description, owner_id, created_at

TeamMember
  - team_id, user_id, role, joined_at

Board
  - id, team_id, name, description, archived, created_at

Column
  - id, board_id, name, position

Task
  - id, column_id, title, description, assignee_id, due_date, position, created_at

Comment
  - id, task_id, user_id, content, created_at
```

### Wireframes

[Link to Figma or attach images]

---

**Document Version**: 1.0
**Author**: [Product Owner]
**Last Updated**: 2025-12-23
