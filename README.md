# Darkmode ShadCN T3 NextAuth db Template

## Useful Resources

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [db](https://db.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Auth

### Callback URL

https://example.com/api/auth/callback/google

### Email Verified

Google also returns a `email_verified` boolean property in the OAuth profile.

You can use this property to restrict access to people with verified accounts at a particular domain.

**~/auth**
```ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  callbacks: {
    async signIn({ account, profile }) {
      if (account.provider === "google") {
        return profile.email_verified && profile.email.endsWith("@example.com")
      }
      return true // Do different verification for other providers that don't have `email_verified`
    },
  },
})
```