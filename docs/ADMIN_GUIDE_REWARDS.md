# Admin Guide - Rewards & Creator Economy Management

## Table of Contents
1. [Admin Dashboard](#admin-dashboard)
2. [Reward Rules Management](#reward-rules-management)
3. [User Management](#user-management)
4. [Moderation & Compliance](#moderation--compliance)
5. [Analytics & Reporting](#analytics--reporting)
6. [Troubleshooting](#troubleshooting)
7. [API Reference](#api-reference)

---

## Admin Dashboard

### Access
- **URL**: `/admin/rewards`
- **Requirement**: Admin role in `admin_users` table
- **Permissions**: Full access to all reward operations

### Dashboard Overview

```
Rewards Administration Dashboard
├── Key Metrics
│   ├── Total Users
│   ├── Total ELOITS Distributed
│   ├── Active Referrals
│   └── Pending Withdrawals
├── Quick Actions
│   ├── Award Points
│   ├── Deactivate Rule
│   ├── Approve Withdrawal
│   └── Ban User
└── Recent Activities
    ├── Latest Transactions
    ├── Recent Challenges
    ├── Withdrawal Requests
    └── Trust Score Changes
```

### Key Metrics

**Total Users**: Count of users with rewards accounts
**Total ELOITS**: Sum of all ELOITS distributed
**This Month**: Monthly ELOITS distribution
**Active Referrals**: Number of active referral relationships

---

## Reward Rules Management

### Understanding Rules

A reward rule defines how many ELOITS a user earns for a specific action.

**Rule Structure**:
```json
{
  "id": "uuid",
  "action_type": "post_creation",
  "display_name": "Create Post",
  "base_eloits": 10,
  "base_wallet_bonus": 0,
  "daily_limit": 100,
  "weekly_limit": 500,
  "monthly_limit": 2000,
  "minimum_trust_score": 20,
  "decay_enabled": true,
  "decay_start": 1,
  "decay_rate": 0.1,
  "min_multiplier": 0.1,
  "is_active": true
}
```

### Creating Rules

**Steps**:
1. Navigate to Admin > Rewards > Rules
2. Click "Create Rule"
3. Fill in required fields:
   - Action Type (unique identifier)
   - Display Name (user-facing)
   - Base ELOITS
4. Configure optional settings:
   - Daily/Weekly/Monthly limits
   - Minimum trust score
   - Decay settings
5. Click "Save"

**Example: New Activity Type**

```
Action Type: video_upload
Display Name: Upload Video
Base ELOITS: 25
Daily Limit: 5 (videos per day)
Decay Enabled: Yes
Decay Rate: 0.1 (10% decrease per repeat)
Min Multiplier: 0.3 (30% minimum)
```

### Editing Rules

1. Find rule in Rules list
2. Click "Edit"
3. Modify fields
4. Click "Save"
5. Cache automatically invalidates

**Rules Affected by Change**: All new activities use updated rule

### Deactivating Rules

**Purpose**: Stop users from earning via this action

**Steps**:
1. Find rule
2. Click "Deactivate"
3. Confirm action
4. Rule no longer appears for users

**Reactivating**: Click "Reactivate" (doesn't change settings)

### Default Rules

| Action | Base ELOITS | Daily Limit | Status |
|--------|-------------|------------|--------|
| post_creation | 10 | 100 | Active |
| engagement | 5 | 500 | Active |
| challenge_complete | 50 | 50 | Active |
| referral_signup | 100 | Unlimited | Active |
| marketplace_sale | Variable | Unlimited | Active |
| freelance_work | Variable | Unlimited | Active |

### Decay System

**Purpose**: Prevent farming same action repeatedly

**How It Works**:
- 1st attempt: 100% reward
- 2nd attempt: 90% reward
- 3rd attempt: 81% reward
- Continues until min_multiplier

**Configuration**:
```
decay_rate: 0.1 (10% reduction)
decay_start: 1 (starts on 1st repeat)
min_multiplier: 0.1 (minimum 10%)
```

**Example**:
```
Base: 100 ELOITS
Attempt 1: 100
Attempt 2: 90
Attempt 3: 81
Attempt 4: 72.9
Attempt 5: 65.6
... (continues down to 10)
```

---

## User Management

### Finding Users

**Search Options**:
- By User ID
- By Email
- By Username
- By Trust Score range
- By Activity type

**Filters**:
```
Search for: "john@example.com"
Trust Score: > 50
Level: >= 5
Activity: Last 30 days
Status: Active
```

### User Profile

**Information Displayed**:
- Basic info (name, email, username)
- Account stats (created, last active)
- Trust score & history
- Total earned & current balance
- Referral stats
- Recent activities
- Withdrawal history

### Awarding Points

**Manual Award for**:
- Special events
- Community contributions
- Platform improvements
- Bug reports
- Customer service issues

**Steps**:
1. Find user
2. Click "Award Points"
3. Enter:
   - Amount (ELOITS)
   - Reason (required)
   - Notes (optional)
4. Click "Award"
5. Auto-logged in audit trail

**Example**:
```
User: john_doe
Amount: 500
Reason: Special event bonus
Notes: Participated in Q4 community challenge
Created By: admin_user
Timestamp: Auto-generated
```

### Trust Score Management

**Manually Adjust** (emergency only):

1. Click user profile
2. Find "Trust Score" section
3. Click "Adjust"
4. Enter:
   - New score
   - Reason
5. Confirm
6. Auto-logs change in trust_history

**When to Adjust**:
- User reports data loss
- System error
- Appeal after ban
- Special circumstances

### User Restrictions

**Suspend User**:
- Can't earn ELOITS
- Can't refer others
- Can't withdraw
- Can still view

**Ban User**:
- Complete account freeze
- All activities blocked
- Can't login

**Steps**:
1. User profile > Actions
2. Select "Suspend" or "Ban"
3. Enter reason
4. Confirm
5. User notified automatically

---

## Moderation & Compliance

### Fraud Detection

**Automatic Alerts for**:
- Unusual withdrawal patterns
- Rapid multiple referrals
- IP address changes
- Login spam attempts
- Duplicate accounts

**Investigation Steps**:
1. Review alert details
2. Check user history
3. Review IP logs
4. Assess trust score changes
5. Take action if needed

### Spam Prevention

**Monitoring**:
- Identical posts in short time
- Mass engagement (likes/comments)
- Inappropriate content
- Harassment reports

**Actions**:
- **Warning**: Notify user
- **Suspend**: Temporary restriction
- **Ban**: Permanent removal
- **Block**: Prevent re-registration

### Compliance Reporting

**GDPR Data Request**:
1. Receive request with user ID
2. Click "Generate Data Export"
3. System collects:
   - Personal data
   - Transaction history
   - Activity logs
   - Referral data
4. Send to user within 30 days

**Account Deletion**:
1. User requests deletion
2. Create deletion request (30-day wait)
3. System archives data
4. After 30 days, permanently delete
5. Log deletion in audit trail

### Audit Trail

**Track All Changes**:
```
Timestamp | Admin | Action | Target | Details
-----------|-------|--------|--------|----------
2024-01-15 | admin1 | award_points | user123 | 1000 ELOITS, event bonus
2024-01-14 | admin2 | adjust_trust | user456 | 50→60, appeal
2024-01-13 | admin1 | ban_user | user789 | Fraud detected
```

**Export Audit Trail**:
1. Admin > Audit
2. Set date range
3. Filter by action
4. Click "Export CSV"

---

## Analytics & Reporting

### Dashboard Metrics

**User Growth**:
- New users this month
- Active users
- Churn rate
- Retention rate

**Earnings Distribution**:
- Total ELOITS distributed
- Average per user
- By activity type
- By tier

**Referral Metrics**:
- Active referrals
- Conversion rate
- Average earnings per referral
- Top referrers

**Withdrawal Stats**:
- Total withdrawn
- Pending amount
- Average amount
- By payment method

### Custom Reports

**Generate Report**:
1. Admin > Reports
2. Select report type
3. Set date range
4. Add filters
5. Click "Generate"
6. Export as CSV or PDF

**Available Reports**:
- User Activity Report
- Earnings Distribution
- Referral Performance
- Trust Score Distribution
- Withdrawal Analysis
- Fraud Detection Summary

### Data Export

**Export Data**:
1. Select report
2. Click "Export"
3. Choose format (CSV, Excel, PDF)
4. Download automatically

**Fields Included**:
- User information
- Transaction details
- Aggregated metrics
- Time-based data

---

## Troubleshooting

### Common Issues

**Problem**: User's balance is incorrect
**Solution**:
1. Check recent transactions
2. Verify all activities logged
3. Review trust score multipliers
4. Recalculate manually
5. Award/deduct difference if needed
6. Document reason

**Problem**: Withdrawal stuck in "processing"
**Solution**:
1. Check payment method info
2. Verify bank details
3. Check withdrawal limits
4. Contact payment provider
5. Retry or refund to balance

**Problem**: Referral earnings not showing
**Solution**:
1. Verify referral is "active"
2. Check if referred user made purchase
3. Review commission calculation
4. Check auto-share percentage
5. Manual adjustment if needed

**Problem**: User can't claim challenge reward
**Solution**:
1. Verify challenge is complete
2. Check hasn't been claimed before
3. Verify user meets requirements
4. Check trust score threshold
5. Manual override if legitimate

### Database Queries

**Check User Balance**:
```sql
SELECT user_id, available_balance, total_earned
FROM user_rewards_summary
WHERE user_id = 'target-user-id';
```

**Recent Transactions**:
```sql
SELECT * FROM reward_transactions
WHERE user_id = 'target-user-id'
ORDER BY created_at DESC
LIMIT 20;
```

**Trust Score History**:
```sql
SELECT * FROM trust_history
WHERE user_id = 'target-user-id'
ORDER BY created_at DESC
LIMIT 10;
```

---

## API Reference

### Admin Endpoints

**POST /api/enhanced-rewards/admin/award-points/:userId**
```json
{
  "amount": 1000,
  "reason": "Special event",
  "notes": "Optional notes"
}
```

**PUT /api/enhanced-rewards/admin/adjust-trust/:userId**
```json
{
  "score": 75,
  "reason": "Appeal approved"
}
```

**POST /api/enhanced-rewards/admin/create-rule**
```json
{
  "action_type": "new_action",
  "display_name": "New Action",
  "base_eloits": 50,
  "daily_limit": 10
}
```

**PUT /api/enhanced-rewards/admin/update-rule/:ruleId**
```json
{
  "base_eloits": 75,
  "daily_limit": 5
}
```

**POST /api/enhanced-rewards/admin/ban-user/:userId**
```json
{
  "reason": "Violation of terms",
  "banType": "permanent"
}
```

**POST /api/enhanced-rewards/admin/approve-withdrawal/:withdrawalId**
```json
{
  "approverNotes": "Approved"
}
```

---

## Security Considerations

### Admin Account Safety

✅ **DO**:
- Use strong passwords (16+ chars)
- Enable 2-factor authentication
- Review audit logs regularly
- Use VPN for remote access
- Log out when finished

❌ **DON'T**:
- Share credentials
- Access from public WiFi
- Leave admin sessions open
- Use personal accounts
- Circumvent RLS policies

### Data Protection

- All admin actions logged
- Audit trail is immutable
- Data encrypted at rest
- SSL/TLS for all connections
- Regular backups

---

## Best Practices

1. **Regular Monitoring**:
   - Review fraud alerts daily
   - Check suspension list weekly
   - Audit high-value transactions

2. **Rule Management**:
   - Test rules before deploy
   - Document all changes
   - Monitor impact on users
   - Adjust based on feedback

3. **User Communication**:
   - Notify before suspensions
   - Explain reward calculation
   - Support appeals process
   - Provide clear guidelines

4. **Data Integrity**:
   - Never bypass RLS policies
   - Log all manual changes
   - Verify before major actions
   - Maintain audit trail

---

## Support & Escalation

**Need Help?**
- Internal Slack: #rewards-support
- Email: rewards-admin@eloity.com
- Database: Check audit logs
- Backup: Restore from snapshot if needed

**Escalation Path**:
1. Try troubleshooting steps
2. Review database directly
3. Consult team lead
4. Contact engineering team
5. Restore from backup if necessary

---

**Last Updated**: December 2024
**Version**: 1.0
**Status**: Production Ready
