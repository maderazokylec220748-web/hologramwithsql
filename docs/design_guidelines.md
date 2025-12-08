# Westmead International School AI Hologram Chatbot - Design Guidelines

## Design Approach

**Selected Approach:** Hybrid - Custom Educational Design System with Hologram Optimization

**Justification:** This is a specialized kiosk application requiring both professional educational credibility and innovative hologram presentation. The dual nature (public chatbot + admin panel) demands a cohesive design system that balances institutional trust with cutting-edge technology.

**Key Design Principles:**
- **Institutional Authority:** Professional, trustworthy design reflecting accredited educational institution
- **Holographic Innovation:** Optimized for pyramid reflector displays with mirrored layouts and high contrast
- **Accessibility First:** Clear typography, high contrast ratios for kiosk visibility from distance
- **Responsive Elegance:** Seamless experience across hologram display and admin interfaces

## Color Palette

### Primary Colors (Westmead Branding)
**Light Mode:**
- **Maroon Primary:** 0 75% 25% (Deep burgundy from logo)
- **Gold Accent:** 48 100% 50% (Vibrant yellow-gold from logo)
- **Cream Background:** 45 30% 97% (Soft warm neutral)
- **Dark Text:** 0 10% 15% (Near black with warm undertone)

**Dark Mode (Hologram Optimized):**
- **Deep Maroon Background:** 0 60% 8% (Rich dark base)
- **Glowing Gold:** 48 100% 65% (Luminous accent for hologram visibility)
- **Maroon Secondary:** 0 70% 20% (Cards/surfaces)
- **Light Text:** 45 20% 95% (Cream white)

### Functional Colors
- **Success (Enrollment):** 145 65% 45%
- **Warning (Deadline):** 35 85% 55%
- **Error:** 0 70% 50%
- **Info (Academic):** 210 80% 55%

### Hologram-Specific Colors
- **Avatar Glow:** 48 100% 70% with blur(20px) - Creates halo effect
- **Logo Idle Glow:** Animated pulse between 48 100% 50% and 48 100% 70%
- **Speech Indicator:** Gradient from gold to maroon with opacity 0.8

## Typography

**Font Stack:**
- **Primary:** 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif
- **Display (Headings):** 'Poppins', 'Inter', sans-serif (for institutional presence)
- **Monospace (Admin/Data):** 'JetBrains Mono', 'Courier New', monospace

**Scale & Weights:**
- **Hero/Hologram Title:** text-6xl (60px), font-bold (700)
- **Chatbot Response:** text-lg (18px), font-medium (500) - optimized readability
- **Body Text:** text-base (16px), font-normal (400)
- **Captions/Metadata:** text-sm (14px), font-light (300)
- **Admin Labels:** text-xs (12px), font-semibold (600), uppercase, tracking-wide

**Hologram Typography Rules:**
- Minimum 18px for any text on hologram display
- Letter-spacing: tracking-wide (0.05em) for glow effect clarity
- Line-height: 1.6 for comfortable reading at distance

## Layout System

**Spacing Primitives:** Tailwind units of 4, 8, 12, 16, 24, 32
- **Hologram Display Padding:** p-8 to p-16
- **Chat Message Spacing:** space-y-4 between messages
- **Admin Panel Grid:** gap-6 between cards
- **Section Spacing:** py-12 (mobile), py-24 (desktop)

**Grid System:**
- **Hologram View:** Single column, centered content, max-w-4xl
- **Admin Dashboard:** 12-column grid with responsive breakpoints
- **FAQ Management:** 2-column layout (list + editor) on lg screens

**Container Constraints:**
- **Chatbot Interface:** max-w-5xl mx-auto (optimized for hologram reflection)
- **Admin Panels:** max-w-7xl mx-auto
- **Modal Dialogs:** max-w-2xl

## Component Library

### Hologram-Specific Components

**1. Hologram Avatar Display**
- Circular frame with double gold border (border-4)
- Animated glow effect using box-shadow with gold color
- Mirrored for pyramid reflector (transform: scaleX(-1))
- Lip-sync animation synchronized with text-to-speech
- Idle state: Westmead logo with subtle pulse animation

**2. Chat Message Bubbles**
- User messages: Maroon background, cream text, rounded-2xl, align right
- AI responses: Gold border (border-2), transparent bg with backdrop-blur, align left
- Typing indicator: Three gold dots with stagger animation
- Message timestamp: text-xs, opacity-60

**3. Voice Input Activator**
- Large circular button with pulsing gold ring animation
- Microphone icon with wave visualization during recording
- Position: fixed bottom-8 right-8, size: w-20 h-20

**4. Quick Action Cards**
- Grid of 4 cards showing: Admissions, Programs, Campus, Scholarships
- Gold icon on maroon card with hover lift effect
- Compact size: h-32, with icon, title, and arrow

### Admin Panel Components

**5. Query Dashboard Table**
- Striped rows with hover state
- Columns: Timestamp, User Type, Query Preview (truncated), Status, Actions
- Sortable headers with chevron indicators
- Pagination with items per page selector

**6. FAQ Manager**
- Split view: Left sidebar (FAQ list), Right panel (Editor)
- Category tags with color coding (Admissions=gold, Academic=maroon, etc.)
- Rich text editor for responses with preview mode
- Drag-and-drop reordering for FAQ priority

**7. User Management Cards**
- Card-based layout showing user avatar, name, role, status
- Inline edit capability with save/cancel actions
- Role selector dropdown with visual badges
- Bulk action toolbar for multi-select operations

**8. Analytics Widgets**
- KPI cards: Total queries, Active sessions, Response time, Satisfaction
- Line chart for query trends (Chart.js with gold/maroon theme)
- Heatmap for peak usage times
- Top 10 questions bar chart

### Shared Components

**9. Navigation**
- **Kiosk:** Minimal floating nav with Home, Help, Language icons
- **Admin:** Sidebar with collapsible sections, icon + label, active state with gold accent

**10. Forms & Inputs**
- Outlined inputs with gold focus ring (ring-2 ring-gold-500)
- Floating labels with smooth animation
- Maroon submit buttons with gold hover state
- Toggle switches with gold active state

**11. Modal/Dialog**
- Backdrop blur with dark overlay (backdrop-blur-md bg-black/40)
- Centered card with gold border-t-4
- Slide-up animation on mobile, fade-in on desktop

**12. Notifications/Toasts**
- Fixed top-right position with slide-in animation
- Success: Gold background with maroon text
- Error: Maroon background with cream text
- Auto-dismiss after 5 seconds with progress bar

## Hologram Display Specifications

**Pyramid Reflector Optimization:**
- All hologram content must be mirrored horizontally (CSS: scaleX(-1))
- High contrast ratios (minimum 7:1) for visibility
- Glow effects using multiple layered shadows for depth
- Transparent backgrounds with backdrop-blur for floating effect
- Animation frame rate capped at 30fps for smooth reflection

**Idle State Animation:**
- Westmead logo centered, scale(1.5)
- Pulsing glow: 0% → 100% opacity over 3s ease-in-out infinite
- Gentle rotation: 360deg over 20s linear infinite
- Text below logo: "Ask me anything about Westmead" with fade-in/out

**Active Conversation State:**
- Avatar positioned top-center with name badge
- Chat messages scroll from bottom with smooth animation
- Response area with typing indicator during AI processing
- Speaking animation: Avatar border pulses with speech rhythm

## Images & Visual Assets

**Required Images:**
1. **Westmead Logo (Provided)** - Used in idle state, header, admin branding
2. **Avatar Hologram** - Professional AI assistant figure (neutral, welcoming) in school colors
3. **Campus Photos** - For virtual tour cards (Library, Labs, Auditorium, Sports Facilities)
4. **Accreditation Badges** - DepEd, TESDA, CHED logos for credibility footer

**Image Treatment:**
- All images should have subtle gold border or frame
- Hologram images require high contrast and edge enhancement
- Admin panel images use rounded-lg corners
- Lazy loading for performance optimization

## Accessibility & Performance

- WCAG AAA compliance for text contrast
- Keyboard navigation for all admin functions
- Screen reader support with ARIA labels
- Reduced motion option for users with vestibular disorders
- Response time target: <100ms for UI interactions
- Text-to-speech with adjustable speed and voice selection
- Multi-language support toggle (EN/TL) with persistent preference