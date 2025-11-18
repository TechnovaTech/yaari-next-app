# Images Folder

Place your images here to use in the Yaari mobile app.

## Recommended Images:

1. **illustration.png** - Character illustration for welcome/login/OTP screens
2. **logo.png** - Yaari logo
3. **icon-chat.png** - Chat bubble icons
4. **icon-heart.png** - Heart icon
5. **male-avatar.png** - Male character avatar
6. **female-avatar.png** - Female character avatar

## Image Specifications:

- Format: PNG with transparency
- Size: Optimize for mobile (max 500KB per image)
- Dimensions: 
  - Illustration: 400x400px
  - Logo: 200x200px
  - Icons: 100x100px
  - Avatars: 150x150px

## Usage in Components:

```jsx
import Image from 'next/image'

<Image 
  src="/images/illustration.png" 
  alt="Yaari" 
  width={200} 
  height={200}
/>
```

Or with regular img tag:

```jsx
<img src="/images/illustration.png" alt="Yaari" />
```
