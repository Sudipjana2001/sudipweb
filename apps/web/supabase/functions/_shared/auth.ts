import { createClient, type User } from "https://esm.sh/@supabase/supabase-js@2";

type ServiceClient = ReturnType<typeof createClient>;

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getPublishableKey() {
  return (
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SB_PUBLISHABLE_KEY")
  );
}

export function getBearerToken(req: Request) {
  const authorization = req.headers.get("Authorization") ?? "";
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
}

export function createServiceClient() {
  return createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

export async function getAuthenticatedUser(req: Request): Promise<User | null> {
  const token = getBearerToken(req);
  const publishableKey = getPublishableKey();

  if (!token || !publishableKey) {
    return null;
  }

  const authClient = createClient(getRequiredEnv("SUPABASE_URL"), publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(token);

  if (error) {
    console.error("Failed to resolve authenticated user:", error);
    return null;
  }

  return user;
}

export async function requireAuthenticatedUser(req: Request) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

export async function isAdminUser(userId: string, serviceClient?: ServiceClient) {
  const supabase = serviceClient ?? createServiceClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    console.error("Failed to verify admin role:", error);
    return false;
  }

  return Boolean(data);
}

export async function requireAdminUser(req: Request, serviceClient?: ServiceClient) {
  const user = await requireAuthenticatedUser(req);
  const admin = await isAdminUser(user.id, serviceClient);

  if (!admin) {
    throw new Error("Admin access required");
  }

  return user;
}
