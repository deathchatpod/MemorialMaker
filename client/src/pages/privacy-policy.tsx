import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last Updated: April 29, 2025
          </p>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">1. Introduction</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                Welcome to Final Spaces LLC ("Company," "we," "our," or "us"). We respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website finalspaces.com (the "Site") or use our memorial and obituary services.
              </p>
              <p className="text-muted-foreground">
                <strong>PLEASE READ THIS PRIVACY POLICY CAREFULLY.</strong> By accessing or using our Site and services, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy. If you do not agree with our policies and practices, please do not use our Site or services.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">2. Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                We collect information from and about users of our Site in several ways:
              </p>
              
              <h4 className="text-foreground font-semibold mt-4">2.1 Personal Information You Provide to Us</h4>
              <p className="text-muted-foreground">
                When you register for an account, generate quotes, research individuals, write obituaries, or use other features of our Site, we may collect various types of personal information, including but not limited to:
              </p>
              <ul className="text-muted-foreground">
                <li>Name, email address, and contact information</li>
                <li>Birth dates, death dates, and other biographical information</li>
                <li>Account login credentials</li>
                <li>Payment information (processed through secure third-party payment processors)</li>
                <li>Information about deceased individuals for obituary and memorial purposes</li>
                <li>Any other information you choose to provide</li>
              </ul>

              <h4 className="text-foreground font-semibold mt-4">2.2 Information Collected Automatically</h4>
              <p className="text-muted-foreground">
                When you visit our Site, we automatically collect certain information about your device and browsing actions, including:
              </p>
              <ul className="text-muted-foreground">
                <li>IP address and device identifiers</li>
                <li>Browser type and operating system</li>
                <li>Pages you view on our Site</li>
                <li>Time and duration of your visits</li>
                <li>Referring websites or search engines</li>
              </ul>
              <p className="text-muted-foreground">
                This information is collected using cookies, web beacons, and similar technologies. We use these technologies to improve our Site, remember your preferences, analyze trends, and provide personalized content.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">3. How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                We may use the information we collect for various purposes, including to:
              </p>
              <ul className="text-muted-foreground">
                <li>Provide, maintain, and improve our services</li>
                <li>Process and manage your account registration</li>
                <li>Fulfill your requests for obituary and memorial services</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Send you technical notices, updates, security alerts, and support messages</li>
                <li>Monitor and analyze trends, usage, and activities in connection with our Site</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                <li>Comply with legal obligations</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">4. Disclosure of Your Information</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                We do not sell or rent your personal information to third parties. However, we may share your information in the following circumstances:
              </p>

              <h4 className="text-foreground font-semibold mt-4">4.1 Public Information</h4>
              <p className="text-muted-foreground">
                Any information you choose to publish on our Site as part of an obituary or memorial will be accessible to the public. Please exercise caution when deciding what information to make public.
              </p>

              <h4 className="text-foreground font-semibold mt-4">4.2 Service Providers</h4>
              <p className="text-muted-foreground">
                We may share your information with third-party vendors, service providers, contractors, or agents who perform functions on our behalf, such as payment processing, data analysis, email delivery, hosting services, and customer service.
              </p>

              <h4 className="text-foreground font-semibold mt-4">4.3 Legal Requirements</h4>
              <p className="text-muted-foreground">
                We may disclose your information if required to do so by law or in the good faith belief that such action is necessary to comply with legal obligations, protect and defend our rights or property, prevent fraud, or protect the personal safety of users of the Site or the public.
              </p>

              <h4 className="text-foreground font-semibold mt-4">4.4 Business Transfers</h4>
              <p className="text-muted-foreground">
                If we are involved in a merger, acquisition, financing, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">5. Data Security</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                We implement reasonable security measures to protect your personal information from unauthorized access, disclosure, alteration, and destruction. However, no Internet or electronic storage system is 100% secure, and we cannot guarantee absolute security of your information. We are not responsible for circumvention of any privacy settings or security measures on our Site.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">6. Your Choices</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <h4 className="text-foreground font-semibold mt-4">6.1 Account Information</h4>
              <p className="text-muted-foreground">
                You may update, correct, or delete your account information at any time by logging into your account or contacting us. We may retain certain information as required by law or for legitimate business purposes.
              </p>

              <h4 className="text-foreground font-semibold mt-4">6.2 Cookies and Tracking Technologies</h4>
              <p className="text-muted-foreground">
                Most web browsers are set to accept cookies by default. If you prefer, you can usually choose to set your browser to remove or reject cookies. Please note that if you choose to remove or reject cookies, this could affect the availability and functionality of our Site.
              </p>

              <h4 className="text-foreground font-semibold mt-4">6.3 Marketing Communications</h4>
              <p className="text-muted-foreground">
                You may opt out of receiving promotional emails from us by following the unsubscribe instructions included in those emails. Even if you opt out, we may still send you non-promotional emails, such as those about your account or our ongoing business relations.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">7. Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                Our Site is not directed to children under the age of 13, and we do not knowingly collect personal information from children. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us, and we will delete such information from our systems.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">8. International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                While we primarily operate in the United States, our Site is accessible worldwide. If you are accessing our Site from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States or other countries where our servers are located. By using our Site, you consent to the transfer of your information to countries outside your country of residence, which may have different data protection rules than those in your country.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">9. Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will post the revised Privacy Policy on this page with an updated revision date. Your continued use of our Site following the posting of changes constitutes your acceptance of such changes.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">10. Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have questions or concerns about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-foreground font-medium">Final Spaces LLC</p>
                <p className="text-muted-foreground">Email: [Insert Contact Email]</p>
                <p className="text-muted-foreground">Phone: [Insert Phone Number]</p>
                <p className="text-muted-foreground">Address: [Insert Address]</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;