# Destination Tree Component

This project now includes a dynamic image-based destination tree component that connects to Supabase for real-time data.

## Features

- **Dynamic Data Loading**: Fetches destinations and hotels from Supabase tables
- **Image-Based UI**: Displays destination and hotel images from Dropbox URLs
- **Hierarchical Tree Structure**: Supports unlimited nesting levels with parent-child relationships
- **Interactive Expansion**: Click to expand/collapse tree branches
- **Selection Management**: Select destinations and hotels with visual feedback
- **Loading States**: Shows loading spinner while fetching data
- **Error Handling**: Displays user-friendly error messages
- **Responsive Design**: Works on desktop and mobile devices

## Supabase Schema

The component expects two tables in your Supabase database:

### `destinations` table
- `id` (string): Unique identifier
- `name` (string): Destination name
- `parent_id` (string, nullable): ID of parent destination (null for root nodes)
- `image_url` (string): Dropbox direct link to destination image
- `created_at` (timestamp, optional)
- `updated_at` (timestamp, optional)

### `hotels` table
- `id` (string): Unique identifier
- `name` (string): Hotel name
- `subregion_id` (string): ID of the destination subregion this hotel belongs to
- `image_url` (string): Dropbox direct link to hotel image
- `created_at` (timestamp, optional)
- `updated_at` (timestamp, optional)

## Usage

The component is integrated into the 7th question of the travel planning form. It replaces the previous text-based destination selector with a modern image-based tree interface.

## Configuration

Supabase connection details are configured in `lib/supabase.ts`:
- Project URL: `https://jiosxmvocybjwomejymg.supabase.co`
- API Key: Configured for anonymous access

## Error Handling

The component handles various error scenarios:
- Network connectivity issues
- Supabase authentication errors
- Missing or malformed data
- Broken image URLs (shows fallback icons)

## Styling

The component uses Tailwind CSS for styling and includes:
- Hover effects and transitions
- Responsive grid layouts
- Loading spinners
- Error state styling
- Selected state highlighting
