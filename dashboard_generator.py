#!/usr/bin/env python3
"""
Social Writer Newsjacking Dashboard UI Concept Generator

This script generates a professional UI concept image for a newsjacking dashboard application
based on the Tavily feature documentation using Pillow (PIL).
"""

import random
from datetime import datetime, timedelta
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageColor
import os

class DashboardGenerator:
    def __init__(self):
        self.width = 1920
        self.height = 1080
        self.colors = {
            'primary': '#2563eb',      # blue-600
            'primary_light': '#3b82f6', # blue-500
            'secondary': '#8b5cf6',     # violet-500
            'success': '#10b981',      # emerald-500
            'warning': '#f59e0b',      # amber-500
            'danger': '#ef4444',       # red-500
            'gray_50': '#f9fafb',      # bg-gray-50
            'gray_100': '#f3f4f6',     # bg-gray-100
            'gray_200': '#e5e7eb',     # bg-gray-200
            'gray_300': '#d1d5db',     # bg-gray-300
            'gray_400': '#9ca3af',     # text-gray-400
            'gray_500': '#6b7280',     # text-gray-500
            'gray_600': '#4b5563',     # text-gray-600
            'gray_700': '#374151',     # text-gray-700
            'gray_800': '#1f2937',     # text-gray-800
            'gray_900': '#111827',     # text-gray-900
            'white': '#ffffff',        # white
            'card_bg': '#ffffff',      # card background
            'sidebar_bg': '#f8fafc'    # sidebar background
        }

        # Font sizes
        self.fonts = {
            'title': 28,
            'subtitle': 24,
            'heading': 20,
            'subheading': 16,
            'body': 14,
            'small': 12,
            'tiny': 11
        }

    def create_base_image(self):
        """Create the base dashboard image with gradient background"""
        # Create gradient background
        img = Image.new('RGB', (self.width, self.height), self.colors['gray_50'])
        draw = ImageDraw.Draw(img)

        # Add subtle gradient overlay
        for i in range(50):
            alpha = int(255 * (1 - i/50))
            color = (*ImageColor.getrgb(self.colors['gray_100']), alpha)
            gradient_y = i * 20
            draw.rectangle([0, gradient_y, self.width, gradient_y + 20], fill=color)

        return img, draw

    def draw_header(self, img, draw):
        """Draw the dashboard header"""
        # Header background
        draw.rectangle([0, 0, self.width, 80], fill=self.colors['white'])
        draw.line([0, 80, self.width, 80], fill=self.colors['gray_200'], width=1)

        # Logo and title
        logo_x, logo_y = 30, 20
        self.draw_pen_tool_icon(draw, logo_x, logo_y, self.colors['primary'])

        # App title
        title_x = logo_x + 35
        self.draw_text(draw, title_x, 15, "Social Writer", self.fonts['title'], self.colors['gray_800'])
        self.draw_text(draw, title_x, 45, "AI-Powered Newsjacking Dashboard", self.fonts['body'], self.colors['gray_600'])

        # User profile area
        profile_x = self.width - 200
        profile_y = 20

        # User avatar
        self.draw_circle(draw, profile_x, profile_y, 20, self.colors['primary_light'])
        self.draw_text(draw, profile_x, profile_y - 5, "JD", self.fonts['small'], self.colors['white'])

        # User name
        self.draw_text(draw, profile_x + 30, 20, "John Doe", self.fonts['body'], self.colors['gray_800'])
        self.draw_text(draw, profile_x + 30, 40, "Premium Plan", self.fonts['small'], self.colors['success'])

        # Notification bell
        bell_x = profile_x - 40
        self.draw_icon(draw, bell_x, profile_y + 5, 'bell', self.colors['gray_500'])
        # Notification dot
        self.draw_circle(draw, bell_x + 12, profile_y - 2, 4, self.colors['danger'])

    def draw_sidebar_left(self, img, draw):
        """Draw the left sidebar with keyword management"""
        sidebar_width = 320
        draw.rectangle([0, 80, sidebar_width, self.height], fill=self.colors['sidebar_bg'])
        draw.line([sidebar_width, 80, sidebar_width, self.height], fill=self.colors['gray_200'], width=1)

        # Sidebar header
        header_x = 20
        self.draw_text(draw, header_x, 100, "Brand Keywords", self.fonts['heading'], self.colors['gray_800'])
        self.draw_text(draw, header_x, 125, "Active keywords searched every 6 hours", self.fonts['small'], self.colors['gray_500'])

        # Add keyword button
        button_y = 155
        self.draw_button(draw, header_x, button_y, 280, 35, "Add Brand Guide", self.colors['primary'], self.colors['white'])

        # Keyword categories
        y_pos = 210
        categories = [
            {
                'name': 'Industry Terms',
                'keywords': [
                    {'term': 'AI Technology', 'active': True, 'weight': 95},
                    {'term': 'Machine Learning', 'active': True, 'weight': 88},
                    {'term': 'Data Science', 'active': False, 'weight': 75}
                ]
            },
            {
                'name': 'Brand Values',
                'keywords': [
                    {'term': 'Innovation', 'active': True, 'weight': 92},
                    {'term': 'Excellence', 'active': True, 'weight': 85},
                    {'term': 'Customer Focus', 'active': True, 'weight': 90}
                ]
            },
            {
                'name': 'Products',
                'keywords': [
                    {'term': 'Analytics Platform', 'active': True, 'weight': 96},
                    {'term': 'AI Solutions', 'active': False, 'weight': 70},
                    {'term': 'Cloud Services', 'active': True, 'weight': 82}
                ]
            }
        ]

        for category in categories:
            # Category header
            self.draw_text(draw, header_x, y_pos, category['name'], self.fonts['subheading'], self.colors['gray_700'])
            y_pos += 25

            # Keywords
            for keyword in category['keywords']:
                self.draw_keyword_card(draw, header_x, y_pos, keyword)
                y_pos += 60

            y_pos += 15

    def draw_keyword_card(self, draw, x, y, keyword):
        """Draw a single keyword card with toggle and weight"""
        card_width = 280
        card_height = 50

        # Card background
        draw.rectangle([x, y, x + card_width, y + card_height],
                      fill=self.colors['white'],
                      outline=self.colors['gray_200'],
                      width=1)

        # Toggle switch
        toggle_x = x + 15
        toggle_y = y + 15
        toggle_size = 20
        toggle_color = self.colors['success'] if keyword['active'] else self.colors['gray_300']

        # Toggle background
        draw.rounded_rectangle([toggle_x, toggle_y, toggle_x + toggle_size * 2, toggle_y + toggle_size],
                              radius=10, fill=toggle_color)

        # Toggle circle
        circle_x = toggle_x + (toggle_size * 1.5) if keyword['active'] else toggle_x + 5
        self.draw_circle(draw, circle_x, toggle_y + toggle_size // 2, 8, self.colors['white'])

        # Keyword text
        text_x = toggle_x + 50
        self.draw_text(draw, text_x, y + 8, keyword['term'], self.fonts['body'],
                      self.colors['gray_800'] if keyword['active'] else self.colors['gray_400'])

        # Weight indicator
        weight_x = text_x
        self.draw_text(draw, weight_x, y + 28, f"Weight: {keyword['weight']}%", self.fonts['small'], self.colors['gray_500'])

        # Weight bar
        bar_x = x + 180
        bar_y = y + 20
        bar_width = 80
        bar_height = 8

        # Background bar
        draw.rounded_rectangle([bar_x, bar_y, bar_x + bar_width, bar_y + bar_height],
                              radius=4, fill=self.colors['gray_200'])

        # Filled bar
        filled_width = int(bar_width * keyword['weight'] / 100)
        if filled_width > 0:
            bar_color = self.colors['success'] if keyword['weight'] >= 80 else self.colors['warning'] if keyword['weight'] >= 60 else self.colors['danger']
            draw.rounded_rectangle([bar_x, bar_y, bar_x + filled_width, bar_y + bar_height],
                                  radius=4, fill=bar_color)

    def draw_main_content(self, img, draw):
        """Draw the main dashboard content with opportunities"""
        left_sidebar_width = 320
        right_sidebar_width = 300
        content_start_x = left_sidebar_width + 20
        content_width = self.width - left_sidebar_width - right_sidebar_width - 40

        # Content header
        self.draw_text(draw, content_start_x, 100, "Newsjacking Opportunities", self.fonts['heading'], self.colors['gray_800'])

        # Filter and sort options
        filter_y = 135
        self.draw_filter_bar(draw, content_start_x, filter_y, content_width)

        # Opportunities grid
        opportunities_y = 180
        opportunities = [
            {
                'title': 'OpenAI Launches GPT-5 with Revolutionary Reasoning',
                'source': 'TechCrunch',
                'time': '2 hours ago',
                'relevance': 95,
                'trending': True,
                'keywords': ['AI Technology', 'Innovation'],
                'summary': 'Major breakthrough in AI capabilities opens new content opportunities...'
            },
            {
                'title': 'Machine Learning Transforming Healthcare Diagnostics',
                'source': 'Forbes',
                'time': '4 hours ago',
                'relevance': 88,
                'trending': True,
                'keywords': ['Machine Learning', 'Innovation'],
                'summary': 'AI-powered diagnostic tools achieving 95% accuracy in early detection...'
            },
            {
                'title': 'Data Science Ethics: New Framework Proposed',
                'source': 'Wired',
                'time': '6 hours ago',
                'relevance': 76,
                'trending': False,
                'keywords': ['Data Science'],
                'summary': 'Industry leaders collaborate on comprehensive ethical guidelines...'
            },
            {
                'title': 'Analytics Platform Market Reaches $50B',
                'source': 'Bloomberg',
                'time': '8 hours ago',
                'relevance': 92,
                'trending': True,
                'keywords': ['Analytics Platform', 'Innovation'],
                'summary': 'Explosive growth driven by AI integration and cloud adoption...'
            }
        ]

        card_spacing = 20
        for i, opportunity in enumerate(opportunities):
            card_y = opportunities_y + i * (200 + card_spacing)
            if card_y + 200 < self.height - 100:  # Only draw cards that fit
                self.draw_opportunity_card(draw, content_start_x, card_y, content_width, opportunity)

    def draw_filter_bar(self, draw, x, y, width):
        """Draw filter and sort bar"""
        # Search bar
        search_width = 300
        search_height = 35
        draw.rounded_rectangle([x, y, x + search_width, y + search_height],
                              radius=18, fill=self.colors['white'], outline=self.colors['gray_300'])

        # Search icon
        self.draw_icon(draw, x + 12, y + 8, 'search', self.colors['gray_400'])

        # Search text
        self.draw_text(draw, x + 35, y + 8, "Search opportunities...", self.fonts['body'], self.colors['gray_400'])

        # Filter buttons
        filter_x = x + search_width + 15
        filters = ['All', 'Trending', 'High Relevance', 'Recent']
        for i, filter_text in enumerate(filters):
            button_x = filter_x + i * 110
            is_active = i == 0
            button_color = self.colors['primary'] if is_active else self.colors['white']
            text_color = self.colors['white'] if is_active else self.colors['gray_600']

            self.draw_button(draw, button_x, y, 100, search_height, filter_text,
                           button_color, text_color, border_color=self.colors['gray_300'])

    def draw_opportunity_card(self, draw, x, y, width, opportunity):
        """Draw a news opportunity card"""
        card_height = 200

        # Card shadow effect
        shadow_offset = 3
        shadow_color = (*ImageColor.getrgb(self.colors['gray_300']), 50)
        draw.rounded_rectangle([x + shadow_offset, y + shadow_offset, x + width + shadow_offset, y + card_height + shadow_offset],
                              radius=12, fill=shadow_color)

        # Main card
        draw.rounded_rectangle([x, y, x + width, y + card_height],
                              radius=12, fill=self.colors['white'], outline=self.colors['gray_200'])

        # Header section
        header_height = 60
        draw.rounded_rectangle([x, y, x + width, y + header_height],
                              radius=12, fill=self.colors['gray_50'])

        # Source and time
        self.draw_text(draw, x + 20, y + 15, opportunity['source'], self.fonts['body'], self.colors['gray_600'])
        self.draw_text(draw, x + 20, y + 35, opportunity['time'], self.fonts['small'], self.colors['gray_500'])

        # Trending indicator
        if opportunity['trending']:
            trending_x = x + width - 80
            self.draw_icon(draw, trending_x, y + 20, 'trending-up', self.colors['success'])
            self.draw_text(draw, trending_x + 20, y + 20, "Trending", self.fonts['small'], self.colors['success'])

        # Title
        title_y = y + 75
        self.draw_text(draw, x + 20, title_y, opportunity['title'], self.fonts['subheading'], self.colors['gray_800'])

        # Summary
        summary_y = title_y + 25
        self.draw_text(draw, x + 20, summary_y, opportunity['summary'], self.fonts['body'], self.colors['gray_600'])

        # Keywords
        keywords_y = summary_y + 35
        keyword_x = x + 20
        for i, keyword in enumerate(opportunity['keywords']):
            tag_x = keyword_x + i * 120
            self.draw_tag(draw, tag_x, keywords_y, keyword, self.colors['primary_light'])

        # Relevance score
        score_y = y + card_height - 50
        score_x = x + 20
        self.draw_text(draw, score_x, score_y, "Relevance Score", self.fonts['small'], self.colors['gray_500'])

        # Progress bar
        bar_y = score_y + 20
        bar_width = width - 200
        self.draw_progress_bar(draw, score_x, bar_y, bar_width, opportunity['relevance'])

        # Generate button
        button_x = x + width - 160
        button_y = y + card_height - 45
        self.draw_button(draw, button_x, button_y, 140, 35, "Generate Article", self.colors['primary'], self.colors['white'])

    def draw_sidebar_right(self, img, draw):
        """Draw the right sidebar with trending topics and alerts"""
        sidebar_width = 300
        sidebar_x = self.width - sidebar_width

        draw.rectangle([sidebar_x, 80, self.width, self.height], fill=self.colors['sidebar_bg'])
        draw.line([sidebar_x, 80, sidebar_x, self.height], fill=self.colors['gray_200'], width=1)

        sidebar_content_x = sidebar_x + 20

        # Trending topics section
        self.draw_text(draw, sidebar_content_x, 100, "Trending Topics", self.fonts['heading'], self.colors['gray_800'])

        # Trending chart area
        chart_y = 135
        chart_height = 120
        self.draw_mini_chart(draw, sidebar_content_x, chart_y, sidebar_width - 40, chart_height)

        # Trending items
        trending_y = chart_y + chart_height + 20
        trending_items = [
            {'topic': 'AI Regulation', 'mentions': 15420, 'change': '+23%'},
            {'topic': 'Cloud Security', 'mentions': 12350, 'change': '+15%'},
            {'topic': 'Data Privacy', 'mentions': 9820, 'change': '+8%'},
            {'topic': 'Tech Layoffs', 'mentions': 8450, 'change': '-5%'}
        ]

        for i, item in enumerate(trending_items):
            item_y = trending_y + i * 35
            self.draw_trending_item(draw, sidebar_content_x, item_y, item)

        # Breaking news alerts
        alerts_y = trending_y + len(trending_items) * 35 + 30
        self.draw_text(draw, sidebar_content_x, alerts_y, "Breaking Alerts", self.fonts['heading'], self.colors['gray_800'])

        # Alert items
        alert_items = [
            {'title': 'Breaking: Major AI Company Announcement', 'time': '5 min ago', 'urgency': 'high'},
            {'title': 'New Industry Report Released', 'time': '1 hour ago', 'urgency': 'medium'},
            {'title': 'Market Update: Tech Stocks Surge', 'time': '2 hours ago', 'urgency': 'low'}
        ]

        for i, alert in enumerate(alert_items):
            alert_y = alerts_y + 30 + i * 50
            if alert_y + 45 < self.height - 20:  # Only draw if it fits
                self.draw_alert_item(draw, sidebar_content_x, alert_y, alert)

    def draw_mini_chart(self, draw, x, y, width, height):
        """Draw a simple trending chart"""
        # Chart background
        draw.rectangle([x, y, x + width, y + height], fill=self.colors['white'], outline=self.colors['gray_200'])

        # Simple line chart
        points = []
        for i in range(8):
            point_x = x + 10 + i * (width - 20) // 7
            point_y = y + height - 20 - random.randint(10, height - 40)
            points.append((point_x, point_y))

        # Draw line
        if len(points) > 1:
            draw.line(points, fill=self.colors['primary'], width=2)

        # Draw points
        for point in points:
            self.draw_circle(draw, point[0], point[1], 3, self.colors['primary'])

    def draw_trending_item(self, draw, x, y, item):
        """Draw a single trending topic item"""
        # Topic name
        self.draw_text(draw, x, y, item['topic'], self.fonts['body'], self.colors['gray_800'])

        # Mentions and change
        mentions_x = x + 150
        change_color = self.colors['success'] if item['change'].startswith('+') else self.colors['danger']
        self.draw_text(draw, mentions_x, y, f"{item['mentions']:,}", self.fonts['small'], self.colors['gray_600'])
        self.draw_text(draw, mentions_x + 80, y, item['change'], self.fonts['small'], change_color)

    def draw_alert_item(self, draw, x, y, alert):
        """Draw a breaking news alert item"""
        # Alert icon
        icon_color = self.colors['danger'] if alert['urgency'] == 'high' else self.colors['warning'] if alert['urgency'] == 'medium' else self.colors['gray_400']
        self.draw_icon(draw, x, y + 2, 'alert-triangle', icon_color)

        # Alert text
        text_x = x + 25
        self.draw_text(draw, text_x, y, alert['title'], self.fonts['small'], self.colors['gray_800'])
        self.draw_text(draw, text_x, y + 18, alert['time'], self.fonts['tiny'], self.colors['gray_500'])

    def draw_progress_bar(self, draw, x, y, width, percentage):
        """Draw a progress bar"""
        height = 8
        radius = 4

        # Background
        draw.rounded_rectangle([x, y, x + width, y + height], radius=radius, fill=self.colors['gray_200'])

        # Filled portion
        filled_width = int(width * percentage / 100)
        if filled_width > 0:
            color = self.colors['success'] if percentage >= 80 else self.colors['warning'] if percentage >= 60 else self.colors['danger']
            draw.rounded_rectangle([x, y, x + filled_width, y + height], radius=radius, fill=color)

        # Percentage text
        text_x = x + width + 10
        self.draw_text(draw, text_x, y - 2, f"{percentage}%", self.fonts['small'], self.colors['gray_600'])

    def draw_tag(self, draw, x, y, text, bg_color):
        """Draw a tag/chip"""
        padding = 8
        text_width = len(text) * 8  # Approximate text width

        draw.rounded_rectangle([x, y, x + text_width + padding * 2, y + 20], radius=10, fill=bg_color)
        self.draw_text(draw, x + padding, y + 2, text, self.fonts['small'], self.colors['white'])

    def draw_button(self, draw, x, y, width, height, text, bg_color, text_color, border_color=None, radius=18):
        """Draw a button"""
        if border_color:
            draw.rounded_rectangle([x, y, x + width, y + height], radius=radius,
                                  fill=bg_color, outline=border_color)
        else:
            draw.rounded_rectangle([x, y, x + width, y + height], radius=radius, fill=bg_color)

        # Center text
        text_bbox = draw.textbbox((0, 0), text, font=None)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]

        text_x = x + (width - text_width) // 2
        text_y = y + (height - text_height) // 2

        self.draw_text(draw, text_x, text_y, text, self.fonts['body'], text_color)

    def draw_text(self, draw, x, y, text, size, color):
        """Draw text with fallback handling"""
        try:
            font = ImageFont.truetype("Arial.ttf", size)
        except:
            try:
                font = ImageFont.load_default()
            except:
                # Fallback to basic text
                draw.text((x, y), text, fill=color)
                return

        draw.text((x, y), text, font=font, fill=color)

    def draw_circle(self, draw, x, y, radius, color):
        """Draw a circle"""
        draw.ellipse([x - radius, y - radius, x + radius, y + radius], fill=color)

    def draw_pen_tool_icon(self, draw, x, y, color):
        """Draw a pen tool icon"""
        size = 24
        # Simple pen icon
        draw.polygon([(x, y), (x + size, y + size//2), (x + size//2, y + size)], fill=color)

    def draw_icon(self, draw, x, y, icon_type, color):
        """Draw a simple icon placeholder"""
        size = 16  # Default icon size
        # Create simple geometric shapes as icon placeholders
        if icon_type == 'bell':
            # Simple bell icon
            draw.ellipse([x, y, x + size, y + size], fill=color)
            draw.rectangle([x + size//3, y + size, x + 2*size//3, y + size + size//3], fill=color)
        elif icon_type == 'search':
            # Simple search icon
            draw.ellipse([x, y, x + size, y + size], fill=color)
            draw.line([(x + size - size//4, y + size - size//4), (x + size, y + size)], fill=color, width=2)
        elif icon_type == 'trending-up':
            # Simple trending up icon
            draw.line([(x, y + size), (x + size//2, y + size//2)], fill=color, width=2)
            draw.line([(x + size//2, y + size//2), (x + size, y)], fill=color, width=2)
            draw.line([(x + size - size//4, y + size//4), (x + size, y)], fill=color, width=2)
        elif icon_type == 'alert-triangle':
            # Simple triangle alert icon
            draw.polygon([(x + size//2, y), (x, y + size), (x + size, y + size)], fill=color)
        else:
            # Default square placeholder
            draw.rectangle([x, y, x + size, y + size], fill=color)

    def generate_dashboard(self, output_path="social-writer-dashboard.png"):
        """Generate the complete dashboard"""
        img, draw = self.create_base_image()

        # Draw all components
        self.draw_header(img, draw)
        self.draw_sidebar_left(img, draw)
        self.draw_main_content(img, draw)
        self.draw_sidebar_right(img, draw)

        # Add some final polish
        img = img.filter(ImageFilter.SMOOTH)

        # Save the image
        img.save(output_path, "PNG", quality=95)
        print(f"Dashboard generated successfully: {output_path}")

        return output_path

def main():
    """Main function to run the dashboard generator"""
    print("Generating Social Writer Newsjacking Dashboard...")

    generator = DashboardGenerator()
    output_file = generator.generate_dashboard()

    print(f"\nDashboard UI concept created: {output_file}")
    print("\nFeatures included:")
    print("- Professional header with app branding and user profile")
    print("- Left sidebar with keyword management and toggle controls")
    print("- Main content area with real-time newsjacking opportunities")
    print("- Right sidebar with trending topics and breaking alerts")
    print("- Modern card-based layout with relevance scoring")
    print("- Interactive elements like toggles, progress bars, and buttons")
    print("- Clean, professional design with proper spacing and hierarchy")

if __name__ == "__main__":
    main()