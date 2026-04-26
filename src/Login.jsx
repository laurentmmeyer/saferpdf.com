import { useEffect, useState } from "react";
import useAuth from "./useAuth.jsx";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import "./Commercial.css";

const STORED_EMAIL_KEY = "saferpdf_signin_email";

const Login = () => {
  const { loading, user } = useAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    if (!isSignInWithEmailLink(auth, window.location.href)) return;

    setCompleting(true);
    let storedEmail = window.localStorage.getItem(STORED_EMAIL_KEY);
    if (!storedEmail) {
      storedEmail = window.prompt(
        "Please confirm the email you used to sign in:",
      );
    }
    if (!storedEmail) {
      setCompleting(false);
      return;
    }
    signInWithEmailLink(auth, storedEmail, window.location.href)
      .then(() => {
        window.localStorage.removeItem(STORED_EMAIL_KEY);
        window.location.href = "/success";
      })
      .catch((err) => {
        setError(err.message);
        setCompleting(false);
      });
  }, []);

  const loginWithGoogle = () => {
    signInWithPopup(getAuth(), new GoogleAuthProvider()).then(
      () => (window.location.href = "/success"),
    );
  };

  const sendEmailLink = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    setError("");
    try {
      await sendSignInLinkToEmail(getAuth(), email, {
        url: window.location.origin + "/login",
        handleCodeInApp: true,
      });
      window.localStorage.setItem(STORED_EMAIL_KEY, email);
      setEmailSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading || completing) {
    return "Loading...";
  }
  if (user.firebaseUser.providerData.length) {
    window.location.href = "/success";
    return null;
  }

  if (emailSent) {
    return (
      <div className="app-w-full app-flex app-justify-center app-items-center app-flex-col app-gap-3 app-p-8 app-text-center">
        <h2 className="app-text-xl app-font-semibold">Check your inbox</h2>
        <p>
          We've sent a sign-in link to <strong>{email}</strong>. Click it from
          this device to finish signing in.
        </p>
      </div>
    );
  }

  return (
    <div className="app-w-full app-flex app-justify-center app-items-center app-flex-col app-gap-5">
      <button
        onClick={loginWithGoogle}
        className="hover:app-cursor-pointer	app-flex app-items-center app-bg-white dark:app-bg-gray-900 app-border app-border-gray-300 app-rounded-lg app-shadow-md app-px-6 app-py-2 app-text-sm app-font-medium app-text-gray-800 dark:app-text-white hover:app-bg-gray-200 focus:app-outline-none focus:app-ring-2 focus:app-ring-offset-2 focus:app-ring-gray-500"
      >
        <svg
          className="app-h-6 app-w-6 app-mr-2"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          width="800px"
          height="800px"
          viewBox="-0.5 0 48 48"
          version="1.1"
        >
          <title>Google-color</title>
          <desc>Created with Sketch.</desc>
          <defs></defs>
          <g
            id="Icons"
            stroke="none"
            strokeWidth="1"
            fill="none"
            fillRule="evenodd"
          >
            <g id="Color-" app-transform="translate(-401.000000, -860.000000)">
              <g id="Google" app-transform="translate(401.000000, 860.000000)">
                <path
                  d="M9.82727273,24 C9.82727273,22.4757333 10.0804318,21.0144 10.5322727,19.6437333 L2.62345455,13.6042667 C1.08206818,16.7338667 0.213636364,20.2602667 0.213636364,24 C0.213636364,27.7365333 1.081,31.2608 2.62025,34.3882667 L10.5247955,28.3370667 C10.0772273,26.9728 9.82727273,25.5168 9.82727273,24"
                  id="Fill-1"
                  fill="#FBBC05"
                ></path>
                <path
                  d="M23.7136364,10.1333333 C27.025,10.1333333 30.0159091,11.3066667 32.3659091,13.2266667 L39.2022727,6.4 C35.0363636,2.77333333 29.6954545,0.533333333 23.7136364,0.533333333 C14.4268636,0.533333333 6.44540909,5.84426667 2.62345455,13.6042667 L10.5322727,19.6437333 C12.3545909,14.112 17.5491591,10.1333333 23.7136364,10.1333333"
                  id="Fill-2"
                  fill="#EB4335"
                ></path>
                <path
                  d="M23.7136364,37.8666667 C17.5491591,37.8666667 12.3545909,33.888 10.5322727,28.3562667 L2.62345455,34.3946667 C6.44540909,42.1557333 14.4268636,47.4666667 23.7136364,47.4666667 C29.4455,47.4666667 34.9177955,45.4314667 39.0249545,41.6181333 L31.5177727,35.8144 C29.3995682,37.1488 26.7323182,37.8666667 23.7136364,37.8666667"
                  id="Fill-3"
                  fill="#34A853"
                ></path>
                <path
                  d="M46.1454545,24 C46.1454545,22.6133333 45.9318182,21.12 45.6113636,19.7333333 L23.7136364,19.7333333 L23.7136364,28.8 L36.3181818,28.8 C35.6879545,31.8912 33.9724545,34.2677333 31.5177727,35.8144 L39.0249545,41.6181333 C43.3393409,37.6138667 46.1454545,31.6490667 46.1454545,24"
                  id="Fill-4"
                  fill="#4285F4"
                ></path>
              </g>
            </g>
          </g>
        </svg>
        <span className={"app-text-black"}>Continue with Google</span>
      </button>

      <div className="app-flex app-items-center app-gap-3 app-w-72">
        <div className="app-flex-1 app-h-px app-bg-gray-300"></div>
        <span className="app-text-sm app-text-gray-500">or</span>
        <div className="app-flex-1 app-h-px app-bg-gray-300"></div>
      </div>

      <form
        onSubmit={sendEmailLink}
        className="app-flex app-flex-col app-gap-3 app-w-72"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="app-px-4 app-py-2 app-border app-border-gray-300 app-rounded-lg app-text-sm focus:app-outline-none focus:app-ring-2 focus:app-ring-purple-500"
        />
        <button
          type="submit"
          disabled={sending || !email}
          className="app-px-5 app-py-2 app-bg-purple-900 app-text-white app-text-sm app-font-medium app-tracking-wider app-rounded-full app-shadow-sm hover:app-shadow-lg hover:app-bg-purple-800 disabled:app-opacity-50 disabled:app-cursor-not-allowed focus:app-outline-none focus:app-ring-2 focus:app-ring-purple-500 focus:app-ring-offset-2"
        >
          {sending ? "Sending..." : "Email me a sign-in link"}
        </button>
      </form>

      {error && (
        <p className="app-text-sm app-text-red-600 app-max-w-xs app-text-center">
          {error}
        </p>
      )}
    </div>
  );
};

export default Login;
