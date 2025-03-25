import { SignIn } from "~/components/auth/sign-in";
import { SignOut } from "~/components/auth/sign-out";
import { ModeToggle } from "~/components/mode-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { auth } from "~/server/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main>
      <div className="flex min-h-screen w-full flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-extrabold">ShadCN + Dark Mode + AuthJS + T3 Template</h1>
        <p>Easily customizable :]</p>
        {session ? <SignOut /> : <SignIn />}
        <ModeToggle />

        {session ? (
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src={session.user.image!} />
              <AvatarFallback>
                {session.user.name
                  ?.split(" ")
                  .map((v) => v.charAt(0).toUpperCase())
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p>
                <span className="font-bold">Name</span> {session.user.name}
              </p>
              <p>
                <span className="font-bold">Email</span> {session.user.email}
              </p>
            </div>
          </div>
        ) : <p className="font-bold">Sign in to see data</p>}
      </div>
    </main>
  );
}
