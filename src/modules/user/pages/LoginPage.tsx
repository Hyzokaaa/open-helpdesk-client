import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import { login, getProfile } from "../services/auth.service";
import {
  LOCAL_STORAGE_KEY,
  LocalStorage,
} from "@modules/app/domain/core/local-storage";
import useUser from "../hooks/useUser";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login({ email, password });
      LocalStorage.set(LOCAL_STORAGE_KEY.ACCESS_TOKEN, res.accessToken);

      const profile = await getProfile();
      setUser(profile);

      navigate("/dashboard");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-card border-card p-8">
          <h1 className="text-xl font-body-bold text-gray-800 mb-1">
            DealerNode Helpdesk
          </h1>
          <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>

          <form onSubmit={handleSubmit}>
            <FormInput label="Email" required>
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={setEmail}
              />
            </FormInput>

            <FormInput label="Password" required>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={setPassword}
              />
            </FormInput>

            <Button type="submit" full loading={loading} className="mt-2">
              Sign In
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
