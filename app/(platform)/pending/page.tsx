import { Clock } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export default function PendingPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10">
            <Clock className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Access pending</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account has been created. An admin needs to assign you a role before you can access courses. Please check back shortly or contact your administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
