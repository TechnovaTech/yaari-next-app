import { ChevronLeft, Shield, Lock, X } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { translations } from '../utils/translations'
import { useEffect, useState } from 'react'
import { trackScreenView, trackEvent } from '../utils/clevertap'

interface PrivacySecurityScreenProps {
  onBack: () => void
}

export default function PrivacySecurityScreen({ onBack }: PrivacySecurityScreenProps) {
  const { lang } = useLanguage()
  const t = translations[lang]
  const [showPrivacyPopup, setShowPrivacyPopup] = useState(false)
  const [showTermsPopup, setShowTermsPopup] = useState(false)
  
  useEffect(() => {
    trackScreenView('Privacy & Security')
  }, [])
  return (
    <div className="min-h-screen bg-white">
      <div className="p-4">
        <button onClick={onBack} className="mb-6">
          <ChevronLeft size={24} className="text-gray-800" />
        </button>
        <h1 className="text-3xl font-bold text-black mb-6">{t.privacySecurityTitle}</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase">{t.dataPrivacy}</h2>
          
          <button 
            onClick={() => { trackEvent('PrivacyPolicyClicked'); setShowPrivacyPopup(true) }}
            className="flex items-center justify-between py-2 w-full"
          >
            <div className="flex items-center space-x-3">
              <Shield className="text-primary" size={20} />
              <p className="font-semibold text-gray-800 mt-2.5">{t.privacyPolicy}</p>
            </div>
            <span className="text-gray-400">›</span>
          </button>

          <button 
            onClick={() => { trackEvent('TermsOfServiceClicked'); setShowTermsPopup(true) }}
            className="flex items-center justify-between py-2 w-full"
          >
            <div className="flex items-center space-x-3">
              <Lock className="text-primary" size={20} />
              <p className="font-semibold text-gray-800 mt-2.5">{t.termsOfService}</p>
            </div>
            <span className="text-gray-400">›</span>
          </button>
        </div>
      </div>

      {showPrivacyPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Privacy Policy</h2>
              <button onClick={() => setShowPrivacyPopup(false)} className="p-2">
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto p-6 text-sm space-y-4">
              <p><strong>Last updated: 12 March 2025</strong></p>
              <p>At Bitesize Learning Private Limited ("Yaari"), your privacy is our priority. This Privacy Policy explains how we collect, use, and share your data when you use the Yaari mobile app ("App") and website ("Website"), together called the "Platform."</p>
              
              <h3 className="font-bold text-base">Who We Are</h3>
              <p>References to "we," "us," or "our" mean Bitesize Learning Private Limited and/or the Platform. "You" or "user" refers to anyone using our Platform.</p>
              
              <h3 className="font-bold text-base">Your Consent</h3>
              <p>By using the Platform, you agree to this Privacy Policy and consent to how we handle your personal information ("Personal Information"). If you don't agree, please don't use the Platform.</p>
              
              <h3 className="font-bold text-base">Using Your Information</h3>
              <p>We use and share your information only as described in this Privacy Policy. We won't disclose your information without your consent, except as explained here.</p>
              <p>This Privacy Policy works alongside our Terms of Service. If there is a conflict, this Privacy Policy takes precedence. Any undefined terms here have the same meaning as in the Terms of Service.</p>
              
              <h3 className="font-bold text-base">HOW DO WE USE YOUR INFORMATION</h3>
              <p>The following table lists the information we collect from you and how we use it:</p>
              
              <div className="space-y-3">
                <div className="border p-3 rounded">
                  <p className="font-semibold mb-1">Account & Profile Information</p>
                  <p className="text-xs mb-2">User ID, mobile number, password, gender, voice recordings, IP address, approximate age range, username, photo, birth year.</p>
                  <p className="text-xs">To create and manage your account, inform you about updates, assist with communication, enforce terms, create new features, provide personalized content, manage the platform, and analyze demographics.</p>
                </div>
                
                <div className="border p-3 rounded">
                  <p className="font-semibold mb-1">Content Shared by You</p>
                  <p className="text-xs mb-2">Personal information, images, quotes, and other shared content.</p>
                  <p className="text-xs">To display shared content within the Platform and enhance personalization.</p>
                </div>
                
                <div className="border p-3 rounded">
                  <p className="font-semibold mb-1">Third-Party Information</p>
                  <p className="text-xs mb-2">Data from business partners, analytics providers, and subcontractors.</p>
                  <p className="text-xs">To analyze traffic, improve features, and evaluate marketing efforts.</p>
                </div>
                
                <div className="border p-3 rounded">
                  <p className="font-semibold mb-1">Log Data & Cookies</p>
                  <p className="text-xs mb-2">IP address, device ID, browsing history, metadata, communication details, cookies.</p>
                  <p className="text-xs">To improve performance, detect issues, maintain security, enhance navigation, and deliver targeted ads.</p>
                </div>
                
                <div className="border p-3 rounded">
                  <p className="font-semibold mb-1">Verification & Contact</p>
                  <p className="text-xs mb-2">Phone number (for OTP verification) and optionally your contacts.</p>
                  <p className="text-xs">To confirm identity, secure accounts, and enable "Invite Users" features.</p>
                </div>
                
                <div className="border p-3 rounded">
                  <p className="font-semibold mb-1">Location & Device Data</p>
                  <p className="text-xs mb-2">GPS or IP-based location, OS, browser, storage, battery, hardware details.</p>
                  <p className="text-xs">To provide location-based features, detect fraud, and optimize the Platform.</p>
                </div>
                
                <div className="border p-3 rounded">
                  <p className="font-semibold mb-1">Interactions</p>
                  <p className="text-xs mb-2">Chat and conversation details, including timestamps and interactions.</p>
                  <p className="text-xs">To improve recommendations and refine user experience.</p>
                </div>
                
                <div className="border p-3 rounded">
                  <p className="font-semibold mb-1">Games, Contests, and Purchases</p>
                  <p className="text-xs mb-2">Contest participation details, financial information for direct purchases.</p>
                  <p className="text-xs">To manage payments, distribute prizes, and record transactions.</p>
                </div>
              </div>
              
              <h3 className="font-bold text-base">YOUR RIGHTS</h3>
              <p className="font-semibold">Removing Content or Deleting Your Account:</p>
              <p>You can delete your content or deactivate/delete your account anytime. However, records of your activity may still remain on our servers.</p>
              
              <p className="font-semibold">Updating Your Information:</p>
              <p>You can update or delete your personal information by logging into your profile. You can also opt out of marketing emails using the unsubscribe link. System-generated emails will still be sent unless your account is deleted.</p>
              
              <p className="font-semibold">Accessing and Correcting Data:</p>
              <p>To access, correct, or update your data, email care@yaari.app.</p>
              
              <p className="font-semibold">Declining or Withdrawing Consent:</p>
              <p>You can withdraw consent for data use by emailing care@yaari.app. Processing may take up to 30 days. Please note this may limit access to some features.</p>
              
              <h3 className="font-bold text-base">HOW YOUR INFORMATION IS SHARED</h3>
              <p className="font-semibold">Information Visible to Other Users</p>
              <p>Parts of your profile (username, age, gender, and location) are visible to others. When you join public rooms, games, or live features, your activity may be visible to other users. During video/audio calls, participants can see and hear your feed.</p>
              <p>You can manage privacy by:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Choosing who can contact you</li>
                <li>Blocking unwanted users</li>
                <li>Reporting inappropriate behavior</li>
              </ul>
              
              <p className="font-semibold">How We Share Data Within Our Group</p>
              <p>We may share your data with affiliated companies for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Safety: Bans or restrictions apply across group platforms.</li>
                <li>Operations: Hosting, support, analytics, marketing, payments, and security.</li>
                <li>Insights: Personalizing your experience and improving services.</li>
                <li>Business Needs: Audits, reporting, and legitimate operational purposes.</li>
              </ul>
              
              <p className="font-semibold">Information You Choose to Share</p>
              <p>When you share content within Yaari or externally (e.g., WhatsApp, Instagram), you control visibility. We are not responsible for how third parties use shared content.</p>
              
              <p className="font-semibold">Sharing with Third Parties</p>
              <p>We may share your data with:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Business Partners: For hosting, payments, security, and advertising (non-identifiable aggregated data).</li>
                <li>Authorities: When legally required or for fraud prevention.</li>
                <li>Business Changes: If Yaari is merged or acquired, data may be transferred. You'll be notified beforehand.</li>
              </ul>
              
              <h3 className="font-bold text-base">Changes to This Policy</h3>
              <p>We may update this Privacy Policy from time to time. Please review this page regularly for changes. Major changes will require renewed consent.</p>
              
              <h3 className="font-bold text-base">Data Retention</h3>
              <p>We retain personal information only as long as needed for business or legal reasons. Sensitive data (like passwords) is retained only as long as necessary. We may retain data for legal or investigation purposes when required.</p>
              
              <h3 className="font-bold text-base">Third-Party Links</h3>
              <p>Our Platform may link to third-party sites. Their privacy practices are not governed by this policy. Please review their policies before sharing personal information.</p>
              
              <h3 className="font-bold text-base">THIRD-PARTY EMBEDS</h3>
              <p className="font-semibold">What Are Third-Party Embeds?</p>
              <p>Some content on Yaari may be hosted by third parties (e.g., YouTube, Giphy, X, SoundCloud). When you view or interact with such content, data may be shared with those providers.</p>
              
              <p className="font-semibold">Sharing Personal Information with Third-Party Embeds</p>
              <p>Some third-party embeds may ask for your data (like email). These are not covered by this policy — review their terms before sharing.</p>
              
              <p className="font-semibold">Creating Your Own Third-Party Embed</p>
              <p>If you embed a form that collects personal data, include a link to your privacy policy. Failure to do so may result in account action.</p>
              
              <h3 className="font-bold text-base">SECURITY PRACTICES</h3>
              <p>We use robust security measures to protect your data. Keep your username and password confidential and avoid sharing them with others.</p>
              
              <h3 className="font-bold text-base">COMMUNICATIONS FROM US</h3>
              <p>We may send essential communications (security, maintenance, or policy updates). These cannot be turned off unless your account is deleted.</p>
              
              <h3 className="font-bold text-base">WHERE WE STORE YOUR PERSONAL INFORMATION</h3>
              <p>Your data is securely stored with Amazon Web Services (AWS) and Google Cloud, both of which maintain high security standards.</p>
              
              <h3 className="font-bold text-base">DISCLAIMER</h3>
              <p>While we take necessary precautions, data transmission over the internet is never fully secure. Once received, we apply strong security controls to protect your data.</p>
              
              <h3 className="font-bold text-base">Yaari Cookie Policy</h3>
              <p><strong>Last updated: 12 March 2025</strong></p>
              <p>This policy provides details about the cookies and tracking technologies used by Yaari. It should be read alongside our Privacy Policy.</p>
              
              <p className="font-semibold">What are cookies, pixels, and local storage?</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Cookies are small files placed on your device to store settings and preferences.</li>
                <li>Pixels are tiny code snippets that help us track engagement.</li>
                <li>Local storage saves data on your device to enhance your experience.</li>
              </ul>
              
              <div className="space-y-2 my-3">
                <div className="border p-2 rounded">
                  <p className="font-semibold text-xs">Necessary</p>
                  <p className="text-xs">Essential for login, security, and fraud prevention. No personal data collected.</p>
                </div>
                <div className="border p-2 rounded">
                  <p className="font-semibold text-xs">Performance</p>
                  <p className="text-xs">Analyze Platform use and performance. No personal data (aggregated).</p>
                </div>
                <div className="border p-2 rounded">
                  <p className="font-semibold text-xs">Functionality</p>
                  <p className="text-xs">Remember preferences and settings. May collect limited info (e.g., username).</p>
                </div>
                <div className="border p-2 rounded">
                  <p className="font-semibold text-xs">Targeting/Advertising</p>
                  <p className="text-xs">Deliver relevant ads and measure effectiveness. May collect IP or browsing behavior.</p>
                </div>
              </div>
              
              <p className="font-semibold">Third-Party Cookies</p>
              <p>We work with partners who may set their own cookies for analytics, hosting, or advertising. Review their privacy policies for more details.</p>
              
              <p className="font-semibold">Why We Use Cookies</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Improve user experience and navigation.</li>
                <li>Retain authentication and preferences.</li>
                <li>Track usage trends and performance.</li>
                <li>Support relevant advertising and analytics.</li>
              </ul>
              
              <p className="font-semibold">How to Control Cookies</p>
              <p>You can manage or block cookies in your browser settings. Disabling cookies may limit access to certain features. For multiple devices, update settings individually.</p>
              
              <p className="font-semibold">Changes to This Cookie Policy</p>
              <p>We may update this policy periodically. Significant updates will be communicated clearly, and the "Last Updated" date will be revised.</p>
              
              <h3 className="font-bold text-base">✅ Contact Us:</h3>
              <p>For privacy-related questions, write to care@yaari.app</p>
            </div>
          </div>
        </div>
      )}

      {showTermsPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Terms of Use</h2>
              <button onClick={() => setShowTermsPopup(false)} className="p-2">
                <X size={24} />
              </button>
            </div>
            <div className="overflow-y-auto p-6 text-sm space-y-4">
              <h3 className="font-bold text-base">Yaari Platform</h3>
              <p>These Terms of Use ("Terms") govern your use of the Yaari mobile application and website ("Platform"), operated by Bitesize Learning Private Limited, a company incorporated under the Companies Act, 2013, with its registered office at Building No./Flat No.: Mantri Espana, Road/Street: Kariammana Agrahara Road, Locality/Sub Locality: Bellandur, City: Bengaluru, District: Bengaluru Urban, State: Karnataka, PIN Code: 560103 ("Company", "we", "us", or "our").</p>
              
              <h3 className="font-bold text-base">1. Acceptance of Terms</h3>
              <p>By downloading, accessing, or using Yaari, you agree to be bound by these Terms. If you do not agree, please do not use the Platform.</p>
              
              <h3 className="font-bold text-base">2. Eligibility</h3>
              <p>You must be at least 18 years old to use Yaari. By using the Platform, you represent that you have the right, authority, and capacity to enter into this agreement.</p>
              
              <h3 className="font-bold text-base">3. Account Registration</h3>
              <p>To use certain features, you must create an account. You agree to provide accurate information and to maintain the security of your login credentials. The Company is not responsible for unauthorized access to your account.</p>
              
              <h3 className="font-bold text-base">4. Use of the Platform</h3>
              <p>You agree to use the Platform only for lawful purposes and in accordance with these Terms. You must not:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Post or share any content that is obscene, offensive, defamatory, or otherwise unlawful.</li>
                <li>Use the Platform to harass, threaten, or harm others.</li>
                <li>Use bots, scripts, or any automated methods to interact with the Platform.</li>
                <li>Attempt to hack, decompile, or reverse-engineer any part of the Platform.</li>
              </ul>
              
              <h3 className="font-bold text-base">5. Content Ownership</h3>
              <p>All content, features, and functionality on the Platform—including text, graphics, logos, and code—are owned by or licensed to the Company and are protected by intellectual property laws. You may not copy, modify, or distribute any part of the Platform without prior written consent.</p>
              
              <h3 className="font-bold text-base">6. User Content</h3>
              <p>You retain ownership of any content you post but grant the Company a worldwide, non-exclusive, royalty-free, transferable license to use, display, reproduce, and distribute such content on the Platform. The Company reserves the right to remove any content that violates these Terms or applicable law.</p>
              
              <h3 className="font-bold text-base">7. Safety and Conduct</h3>
              <p>Yaari promotes authentic connections and respectful behavior. The Company reserves the right to suspend or terminate any account found engaging in harassment, fraud, impersonation, or any behavior that compromises user safety.</p>
              
              <h3 className="font-bold text-base">8. Subscription and Payments</h3>
              <p>Certain features may be available through paid subscriptions. All payments are non-refundable except as required by applicable law. Prices may vary by location and are subject to change with prior notice.</p>
              
              <h3 className="font-bold text-base">9. Privacy Policy</h3>
              <p>Your use of the Platform is also governed by our Privacy Policy. Please review it carefully to understand how we collect, use, and protect your information.</p>
              
              <h3 className="font-bold text-base">10. Limitation of Liability</h3>
              <p>To the fullest extent permitted by law, the Company shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform.</p>
              
              <h3 className="font-bold text-base">11. Termination</h3>
              <p>We may suspend or terminate your access to the Platform at any time without prior notice if we believe you have violated these Terms.</p>
              
              <h3 className="font-bold text-base">12. Governing Law and Jurisdiction</h3>
              <p>These Terms are governed by and construed in accordance with the laws of India. The courts of Bengaluru, Karnataka shall have exclusive jurisdiction over any disputes arising under these Terms.</p>
              
              <h3 className="font-bold text-base">13. Contact Information</h3>
              <p>For any questions or concerns regarding these Terms, please contact us at:</p>
              <p>Email: gopal@yaari.me</p>
              <p className="font-semibold">Registered Office:</p>
              <p>Building No./Flat No.: Mantri Espana,<br/>Kariammana Agrahara Road, Bellandur,<br/>Bengaluru Urban, Karnataka, 560103</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
