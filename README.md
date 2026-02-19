# COMODOCRUISE

A modern travel booking platform for sea voyages, built with Next.js 16 and TypeScript.

## Features

- 🚢 **Ship Listings** - Browse and book various ships and cruises
- 💰 **Promo Section** - Special offers and discounted trips
- 🔍 **Smart Booking Bar** - Search that follows you on scroll
- 🌍 **Multi-language Support** - i18n with 13+ languages
- 📱 **Responsive Design** - Mobile-first approach
- ⚡ **Fast & Static** - Static export for blazing fast performance

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd comodocruise
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Project Structure

```
comodocruise/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (en)/           # English routes (default)
│   │   ├── [lang]/         # Localized routes
│   │   ├── _pages/         # Shared page components
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   ├── config/            # Configuration files
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   └── locales/           # Translation files
├── public/                # Static assets
└── package.json
```

## Key Components

### BookingBar
A smart booking search bar that:
- Displays at the bottom of the hero section
- Transitions to header when user scrolls past hero
- Supports destination, date, and guest selection

### PromoSection
Displays special offers with:
- Discounted prices
- Operator information
- Eye-catching discount badges

### ShipsSection
Fleet overview showing:
- Ship images and names
- Operator details
- Cabin count and max passengers
- Pricing per night

## API Integration

Data for ships, cabins, prices, and availability comes from the backend API:
- Ships: `/api/ships`
- Availability: `/api/availability`
- Bookings: `/api/bookings`

Currently using placeholder data - connect to your API endpoints.

## Styling

- **Tailwind CSS v4** - Utility-first CSS
- **Custom CSS** - Component-specific styles in globals.css
- **Google Fonts** - Cormorant Garamond & Roboto Condensed

## Internationalization

Supports 13 languages:
- English (default, at root `/`)
- German (`/de`)
- French (`/fr`)
- Indonesian (`/id`)
- And more...

## License

Private - All rights reserved.
