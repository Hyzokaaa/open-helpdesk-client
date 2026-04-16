import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { toast } from "react-toastify";
import Button from "@modules/app/modules/ui/components/Button/Button";
import Input from "@modules/app/modules/ui/components/Input/Input";
import FormInput from "@modules/app/modules/ui/components/FormInput/FormInput";
import { register } from "../services/auth.service";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register({ email, password, firstName, lastName });
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-card border-card p-8">
          <h1 className="text-xl font-body-bold text-gray-800 mb-1">
            Create Account
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Join DealerNode Helpdesk
          </p>

          <form onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <FormInput label="First Name" required>
                <Input
                  placeholder="John"
                  value={firstName}
                  onChange={setFirstName}
                />
              </FormInput>
              <FormInput label="Last Name" required>
                <Input
                  placeholder="Doe"
                  value={lastName}
                  onChange={setLastName}
                />
              </FormInput>
            </div>

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
                placeholder="Min. 6 characters"
                value={password}
                onChange={setPassword}
              />
            </FormInput>

            <Button type="submit" full loading={loading} className="mt-2">
              Create Account
            </Button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
