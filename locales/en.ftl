# ─── Navigation & Common ────────────────────────────
friend = there
common-back = 🔙 Back
common-cancel = ❌ Cancel
common-confirm = ✅ Confirm
common-prev = ⬅️ Prev
common-next = ➡️ Next
common-page = Page { $current }/{ $total }
common-close = ❌ Close
language-english = 🇬🇧 English
language-persian = 🇮🇷 فارسی

# ─── User Menu (Reply Keyboard) ──────────────────────
menu-user-help = 📋 Help
menu-user-profile = 👤 My Profile
menu-user-support = 📞 Support
menu-user-about = ℹ️ About

# ─── Welcome / Start ─────────────────────────────────
welcome = 👋 <b>Welcome, { $name }</b>

    Choose a section from the menu below.

help = 📋 <b>Help & Features</b>

    Available commands and features:
    • <b>/start</b> - Open the main menu
    • <b>/help</b> - Show this help message
    • <b>/profile</b> - View your profile and edit details
    • <b>/notifications</b> - Configure notification preferences
    • <b>/support</b> - Contact support team
    • <b>/about</b> - Information about this service

help-admin = 📋 <b>Help & Features</b>

    Available commands and features:
    • <b>/start</b> - Open the main menu
    • <b>/help</b> - Show this help message
    • <b>/profile</b> - View your profile and edit details
    • <b>/notifications</b> - Configure notification preferences
    • <b>/support</b> - Contact support team
    • <b>/about</b> - Information about this service
    • <b>/admin</b> - Open the admin management panel

about = ℹ️ <b>About this bot</b>

    A fast and reliable Telegram service with a simple, bilingual interface.

# ─── User Profile ─────────────────────────────────────
user-profile-title = 👤 <b>My Profile</b>
user-profile-id = 🆔 <b>ID:</b> <code>{ $id }</code>
user-profile-name = 👤 <b>Name:</b> { $name }
user-profile-username = 🔗 <b>Username:</b> { $username }
user-profile-joined = 📅 <b>Joined:</b> <code>{ $joined }</code>
user-profile-status = 📌 <b>Status:</b> { $status }
user-profile-status-active = 🟢 Active
user-profile-status-banned = 🚫 Banned
user-profile-btn-notifications = 🔔 Notifications
user-profile-btn-lang = 🌐 Language
user-profile-edit-name-prompt = ✏️ Please send your new first name (or type /cancel to go back):
user-profile-edit-name-success = ✅ Your name has been updated to <b>{ $name }</b>!
user-profile-premium = ⭐ Premium: { $isPremium }
user-profile-language = 🌐 Language: { $lang }
user-profile-ban-reason = 📝 Ban Reason: { $reason }
user-profile-yes = Yes
user-profile-no = No
user-profile-none = None

# ─── Support Flow ─────────────────────────────────────
support-intro = 📞 <b>Support & Assistance</b>

    Please type and send your message or question. It will be forwarded directly to our support team.
support-sent-success = ✅ Your message has been sent to the support team. We will get back to you soon!
support-admin-forward = 📬 <b>New Support Message</b>

    👤 <b>User:</b> { $name }
    🆔 <b>ID:</b> <code>{ $id }</code>
    🔗 <b>Username:</b> { $username }
support-admin-btn-view-user = 👤 View User
support-admin-btn-reply = ✉️ Reply
support-admin-btn-ban = 🚫 Ban
support-admin-msg-failed = ⚠️ <b>Failed to deliver user message</b>

    Forwarding and copying the user's message failed with the following error:
    <code>{ $error }</code>

# ─── Settings Feature ─────────────────────────────────
settings-title = ⚙️ <b>Settings</b>

    Manage your interface preferences:
settings-language = 🌐 <b>Language Selection</b>

    Choose the language used across the bot:
settings-language-changed = ✅ Language updated successfully!
settings-language-button = 🌐 Interface language
settings-home-button = 🏠 Main menu
settings-back-button = ↩️ Back
settings-notifications-button = 🔔 Notification preferences

# ─── Admin Menu (Root) ────────────────────────────────
admin-menu-title = 🛡 <b>Admin Panel</b>

    Welcome to the management control center.
admin-btn-stats = 📊 Stats
admin-btn-users = 👥 Users
admin-btn-broadcast = 📢 Broadcast
admin-btn-settings = ⚙️ Settings
admin-btn-close = ❌ Close
admin-closed-alert = Admin panel closed

# ─── Admin: Stats ─────────────────────────────────────
admin-stats-title = 📊 <b>Bot Statistics</b>
admin-stats-total = 👥 <b>Total users:</b> <code>{ $total }</code>
admin-stats-active-today = 🟢 <b>Active today:</b> <code>{ $active }</code>
admin-stats-new-7days = 🆕 <b>New (7 days):</b> <code>{ $newUsers }</code>
admin-stats-banned = 🚫 <b>Banned:</b> <code>{ $banned }</code>

# ─── Admin: Users ─────────────────────────────────────
admin-users-title = 👥 <b>User Management</b>

    Search for a user or browse the registered users list:
admin-users-btn-search = 🔍 Search
admin-users-btn-list = 📋 List
admin-users-card-title = 👤 <b>User Details</b>
admin-users-btn-message = ✉️ Message
admin-users-btn-ban = 🚫 Ban
admin-users-btn-unban = ✅ Unban
admin-users-btn-back-list = 🔙 Back to list
admin-users-search-prompt = 🔍 <b>Search Users</b>

    Send a user ID or @username, forward a message, or tap the button below to pick a user from your contacts:
admin-users-search-btn-contacts = 👤 Choose from contacts
admin-users-search-no-results = ❌ No registered user found for “{ $query }”.
admin-users-search-results = 🔍 Found <b>{ $count }</b> user(s) matching “{ $query }”:

# ─── Admin: Confirmations ─────────────────────────────
admin-confirm-ban-title = ⚠️ <b>Confirm Ban</b>

    Are you sure you want to ban <b>{ $name }</b> (<code>{ $id }</code>)?
admin-confirm-unban-title = ⚠️ <b>Confirm Unban</b>

    Are you sure you want to unban <b>{ $name }</b> (<code>{ $id }</code>)?
admin-action-ban-success = User { $id } has been banned.
admin-action-unban-success = User { $id } has been unbanned.

# ─── Admin: Direct Message ────────────────────────────
admin-dm-prompt = ✉️ <b>Direct Message / Reply</b>

    Sending message to: <b>{ $name }</b> (<code>{ $id }</code>)

    Please send your reply message (text, photo, video, voice, document, etc.):
admin-dm-success = ✅ Message delivered to <b>{ $name }</b>.
admin-dm-failed = ❌ Failed to deliver message: { $error }
admin-dm-incoming-header = 📬 <b>Support response to your message:</b>

# ─── Admin: Broadcast ─────────────────────────────────
admin-broadcast-step1-title = 📢 <b>Broadcast — Step 1/4: Select Audience</b>

    Choose who should receive this broadcast:
admin-broadcast-aud-all = 👥 All users ({ $count })
admin-broadcast-aud-active = 🟢 Active only ({ $count })
admin-broadcast-step2-prompt = 📢 <b>Broadcast — Step 2/4: Message Content</b>

    Send the message content you want to broadcast (text, photo, etc.).
admin-broadcast-step3-title = 📢 <b>Broadcast — Step 3/4: Message Preview</b>

    Here is how your message will appear:
admin-broadcast-btn-send = ✅ Send
admin-broadcast-btn-edit = ✏️ Edit
admin-broadcast-step4-report = 📢 <b>Broadcast Result</b>

    ✅ <b>Sent:</b> { $sent }
    ❌ <b>Failed:</b> { $failed }

# ─── Admin: Settings ──────────────────────────────────
admin-settings-title = ⚙️ <b>Bot Settings</b>
admin-settings-maint-on = 🔧 Maintenance mode: ✅
admin-settings-maint-off = 🔧 Maintenance mode: ❌
admin-settings-force-join-on = 📢 Force channel join: ✅
admin-settings-force-join-off = 📢 Force channel join: ❌
admin-settings-edit-welcome = ✉️ Edit welcome message
admin-settings-welcome-prompt = ✉️ <b>Edit Welcome Message</b>

    Current welcome message:
    { $current }

    Send the new welcome message text, or send <code>/reset</code> to revert to default:
admin-settings-welcome-updated = ✅ Welcome message updated successfully!
admin-settings-welcome-reset = ✅ Welcome message reset to default!
admin-settings-language = 🌐 Default Language
admin-settings-language-prompt = 🌐 <b>Select Bot Default Language</b>

    Choose the default bot language for users who haven't selected a preference:
admin-ban-reason-prefix = 📝 <b>Ban Reason:</b> { $reason }

# ─── Notifications Feature ────────────────────────────
notifications-title = 🔔 <b>Notification preferences</b>

    Choose which updates you want to receive. Changes apply to queued and scheduled notifications.
notifications-type-announcements = Announcements
notifications-type-reminders = Reminders
notifications-type-product-updates = Product updates
notifications-enabled = Notifications enabled
notifications-disabled = Notifications muted
pagination-previous = ‹ Previous
pagination-next = Next ›

# ─── Legacy & Utility Keys ─────────────────────────────
menu-settings = ⚙️ Settings
menu-help = 🧭 Help & support
menu-about = ℹ️ About
menu-home = 🏠 Main menu
menu-admin = 🛡 Admin panel
menu-back-to-help = ↩️ Help
media-saved = ✅ { $kind } stored securely.
media-rejected = ⚠️ This file was not stored: { $reason }
media-kind-photo = Photo
media-kind-document = Document
media-kind-video = Video
inline-result-title = Use “{ $query }”
inline-empty-title = Open the bot
inline-result-description = Share this result in the current chat
inline-result-message = { $query }
inline-empty-message = Open @{ $username } to get started.
webapp-intro = Open the Mini App to send a secure field note back to this chat.
webapp-open-button = Open Mini App
webapp-private-only = The Mini App can only be opened in a private chat.
webapp-unavailable = The Mini App URL has not been configured yet.
webapp-invalid-data = The Mini App returned invalid data. Please reopen it and try again.
webapp-data-received = ✅ Note received: { $value }
maintenance-mode-alert = 🔧 Bot is currently undergoing scheduled maintenance. Please check back later.
banned-user-alert = 🚫 You have been banned from using this bot.
example-ask-name = What is your name?
example-confirm = Nice to meet you, <b>{ $name }</b>! Is that correct? (yes/no)
example-success = ✅ Great! Welcome, <b>{ $name }</b>!
example-cancelled = ❌ Cancelled. You can try again anytime.
error-generic = ⚠️ Something went wrong. Please try again later.
unknown-command = ⚠️ Command not found. Please use the buttons below.
admin-access-denied = 🔒 This section is only available to bot administrators.
