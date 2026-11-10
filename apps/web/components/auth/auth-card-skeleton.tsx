import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

// Fallback for auth forms that read the URL's search params on the client.
export function AuthCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex h-72 items-center justify-center">
        <Spinner className="size-5 text-muted-foreground" />
      </CardContent>
    </Card>
  );
}
