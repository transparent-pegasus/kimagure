import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a placeholder for the privacy policy.</p>
        </CardContent>
      </Card>
    </div>
  );
}
