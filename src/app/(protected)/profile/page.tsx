"use client";

import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/actions/logout";
import { updateUserImage } from "@/actions/update-profile";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@radix-ui/react-label";
import { Pencil, User } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const Profile = () => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔥 Get both user and update function from the hook
  const { user: session, update: updateSession } = useCurrentUser();
  
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !session?.email) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg)$/)) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (e.g., 5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData and upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "your_upload_preset"
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      const imageUrl = data.secure_url;

      // Update user image in database
      const result = await updateUserImage(session.email, imageUrl);

      if (result.error) {
        toast.error(result.error);
      } else {
        // 🔥 Update the session to reflect the new image
        await updateSession({
          image: result.user?.image,
        });

        toast.success("Profile image updated successfully!");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const onClick = () => {
    logout();
  };

  return !session ? (
    redirect("/")
  ) : (
    <div
      className="flex flex-col space-y-20 items-center justify-center pt-32 px-8 landing"
      role="main"
      aria-label="session profile"
    >
      <Card className="p-4 sm:w-[350px] w-[300px] bg-gradient-to-br from-blue-50 via-white to-blue-100 shadow-md">
        <CardContent className="space-y-4">
          <div
            className="flex justify-center mb-4 relative group cursor-pointer"
            role="img"
            aria-label="Profile picture"
            onClick={handleImageClick}
          >
            {session?.image ? (
              <img
                src={session.image}
                alt={`${session.name}'s profile picture`}
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 hover:border-blue-400 transition-colors"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 hover:border-blue-400 transition-colors"
                aria-hidden="true"
              >
                <User className="w-12 h-12 text-gray-500" />
              </div>
            )}
            <div className="absolute sm:top-1 sm:right-22 top-2 right-16 bg-white rounded-full p-1 shadow-md border border-gray-200">
              <Pencil className="w-4 h-4 text-gray-600" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              disabled={isUploading}
            />
          </div>
          {isUploading && (
            <div className="flex justify-center items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Uploading...</span>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xl font-semibold">
              Name
            </Label>
            <h2 id="name" className="text-gray-600">
              {session?.name || "Unable to found"}
            </h2>
          </div>
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xl font-semibold">
              Email
            </Label>
            <h2 id="email" className="text-gray-600">
              {session?.email || "Not provided"}
            </h2>
          </div>
        </CardContent>
        <CardFooter className="mt-2">
          <Button
            type="button"
            variant="default"
            onClick={onClick}
            className="w-full bg-red-500 hover:bg-red-600"
            aria-label="Logout from your account"
          >
            Logout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Profile;
