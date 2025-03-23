import { auth } from "~/server/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main>
      <h1>Template</h1>
      <p>Woo woo woo</p>
    </main>
  );
}
