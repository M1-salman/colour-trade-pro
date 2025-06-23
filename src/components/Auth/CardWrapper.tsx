"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { BackButton } from "@/components/Auth/BackButton";

// interface
interface CardWrapperProps {
  children: React.ReactNode;
  headerTitle: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
}

export const CardWrapper = ({
  children,
  showSocial,
  backButtonLabel,
  backButtonHref,
  headerTitle,
}: CardWrapperProps) => {
  return (
    <Card className="sm:w-[450px] w-[350px] mb-8">
      <CardHeader>
        <CardTitle className="text-center text-4xl font-bold">
          {headerTitle}
        </CardTitle>
      </CardHeader>

      <CardContent>{children}</CardContent>

      <CardFooter>
        <BackButton label={backButtonLabel} href={backButtonHref} />
      </CardFooter>
    </Card>
  );
};
