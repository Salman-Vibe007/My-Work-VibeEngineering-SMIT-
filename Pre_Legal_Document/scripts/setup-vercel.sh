#!/bin/bash
# Vercel Deployment Setup Script
# Run this script to prepare your project for Vercel deployment

set -e

echo "🚀 Setting up Pre Legal Document Generator for Vercel deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    pnpm add -g vercel@latest
fi

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please log in to Vercel:"
    vercel login
fi

# Get project settings
echo "📋 Project Configuration"
read -p "Vercel Organization ID (or press Enter to create new): " VERCEL_ORG_ID
read -p "Vercel Project ID (or press Enter to create new): " VERCEL_PROJECT_ID
read -p "Production Domain (e.g., prelegal.app): " PRODUCTION_DOMAIN

# Create or link project
if [ -z "$VERCEL_PROJECT_ID" ]; then
    echo "🔗 Creating new Vercel project..."
    vercel link --yes
else
    echo "🔗 Linking to existing project..."
    vercel link --project=$VERCEL_PROJECT_ID --organization=$VERCEL_ORG_ID --yes
fi

# Set environment variables
echo "⚙️  Setting up environment variables..."

# Required variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "AUTH_SECRET"
    "NEXT_PUBLIC_APP_URL"
)

# Optional variables
OPTIONAL_VARS=(
    "POSTGRES_PASSWORD"
    "REDIS_URL"
    "REDIS_PASSWORD"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "MICROSOFT_CLIENT_ID"
    "MICROSOFT_CLIENT_SECRET"
    "EMAIL_FROM"
    "EMAIL_API_KEY"
    "EMAIL_PROVIDER"
    "STORAGE_ENDPOINT"
    "STORAGE_BUCKET"
    "STORAGE_ACCESS_KEY"
    "STORAGE_SECRET_KEY"
    "STORAGE_REGION"
    "PAYMENT_SECRET_KEY"
    "PAYMENT_PUBLISHABLE_KEY"
    "PAYMENT_WEBHOOK_SECRET"
    "STRIPE_API_VERSION"
    "AI_PROVIDER"
    "AI_API_KEY"
    "AI_MODEL"
    "SENTRY_DSN"
    "SENTRY_ORG"
    "SENTRY_PROJECT"
    "ENABLE_AI_ASSISTANCE"
    "ENABLE_WORKSPACES"
    "ENABLE_E_SIGNATURES"
    "ENABLE_DARK_MODE"
    "CRON_SECRET"
)

echo "Setting required variables (production environment)..."
for var in "${REQUIRED_VARS[@]}"; do
    read -sp "Enter $var: " value
    echo
    if [ -n "$value" ]; then
        vercel env add "$var" production <<< "$value"
    fi
done

echo "Setting optional variables (press Enter to skip)..."
for var in "${OPTIONAL_VARS[@]}"; do
    read -sp "Enter $var: " value
    echo
    if [ -n "$value" ]; then
        vercel env add "$var" production <<< "$value"
    fi
done

# Add preview environment variables (same as production for now)
echo "📝 Adding preview environment variables..."
vercel env ls --environment=production | grep -v "^$" | while read line; do
    var=$(echo "$line" | awk '{print $1}')
    if [ -n "$var" ] && [ "$var" != "NAME" ]; then
        value=$(vercel env pull --environment=production 2>/dev/null | jq -r ".${var}" 2>/dev/null || echo "")
        if [ -n "$value" ] && [ "$value" != "null" ]; then
            vercel env add "$var" preview <<< "$value" 2>/dev/null || true
        fi
    fi
done

# Deploy to preview
echo "🚀 Deploying to preview..."
vercel --prod=false

# Get deployment URL
PREVIEW_URL=$(vercel inspect $(vercel ls --limit=1 --json | jq -r '.[0].uid') --json | jq -r '.url')
echo "✅ Preview deployment ready at: https://$PREVIEW_URL"

# Configure custom domain
if [ -n "$PRODUCTION_DOMAIN" ]; then
    echo "🌐 Adding custom domain: $PRODUCTION_DOMAIN"
    vercel domains add "$PRODUCTION_DOMAIN" --environment=production
    vercel alias set "$PREVIEW_URL" "$PRODUCTION_DOMAIN"
fi

# Setup GitHub integration
echo "🔧 Setting up GitHub integration..."
echo "Please connect your GitHub repository in Vercel Dashboard:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Select your project"
echo "3. Go to Settings > Git"
echo "4. Connect your GitHub repository"
echo "5. Enable 'Deploy on push to main'"

echo ""
echo "✅ Vercel setup complete!"
echo ""
echo "Next steps:"
echo "1. Add the following secrets to your GitHub repository (Settings > Secrets > Actions):"
echo "   - VERCEL_TOKEN (from https://vercel.com/account/tokens)"
echo "   - VERCEL_ORG_ID (from vercel inspect)"
echo "   - VERCEL_PROJECT_ID (from vercel inspect)"
echo "   - DATABASE_URL"
echo "   - AUTH_SECRET"
echo "   - All other environment variables"
echo ""
echo "2. Configure your DNS for custom domain"
echo "3. Set up Stripe webhooks pointing to https://$PRODUCTION_DOMAIN/api/webhooks/stripe"
echo "4. Configure OAuth redirect URIs for Google/Microsoft"
echo ""
echo "Happy deploying! 🎉"