import useAuth from "./useAuth.jsx";
import { useEffect, useState } from "react";
import { GoogleAuthProvider, linkWithPopup, unlink } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Trans, useTranslation } from "react-i18next";
import "./Commercial.css";
import { PurpleLink } from "./PurpleLink.jsx";

const SuccessMessage = ({ purchaseType, product }) => {
  const { t } = useTranslation();
  // Determine the message based on the purchase type
  let message;
  switch (purchaseType) {
    case "subscription":
      message = (
        <span>
          <Trans
            i18nKey="success.subscriptionMessage"
            values={{ product }}
            components={{ b: <b /> }}
          />
        </span>
      );
      break;
    case "payment":
      message = (
        <div
          className={"app-flex app-flex-col app-gap-3 app-text-lg app-w-full"}
        >
          <div>
            <Trans
              i18nKey="success.paymentLine1"
              values={{ product }}
              components={{ b: <b /> }}
            />
          </div>
          <div>
            {t("success.paymentLine2")} <br />
          </div>
          <PurpleLink link="/" text={t("success.compressNow")} />
          {product === "Entreprise" && (
            <div>
              {t("success.enterpriseExtra")}{" "}
              <a
                className={"app-underline"}
                href={"mailto:contact@saferpdf.com"}
              >
                contact@saferpdf.com
              </a>
              .
            </div>
          )}
        </div>
      );
      break;
  }

  return (
    <div className="app-flex app-flex-col app-items-center app-justify-center app-w-full">
      <div className="app-bg-white app-rounded-lg app-p-6 app-shadow-md app-w-full">
        <div className="app-flex app-flex-col app-items-center app-w-full">
          {/* Green check icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="app-h-16 app-w-16 app-text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {/* Display the determined message */}
          <div className="app-mt-4 app-text-center app-text-lg app-font-normal app-text-gray-700 app-w-full">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
};

const PleaseAuth = ({ user: firebaseUser }) => {
  const { t } = useTranslation();
  const handleLoginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    linkWithPopup(firebaseUser, provider)
      .then((result) => {
        window.location.href = "/";
      })
      .catch((err) => alert(err.message));
  };

  return (
    <div className="app-bg-white app-rounded-lg app-p-6 app-shadow-md app-m-2 app-max-w-screen-md app-flex-col app-flex app-gap-3 justify-center app-w-full">
      <div className="app-text-lg">
        {t("success.linkAccountMessage")}
      </div>
      <div className={"app-flex app-justify-center"}>
        <button
          onClick={handleLoginWithGoogle}
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
              <g
                id="Color-"
                app-transform="translate(-401.000000, -860.000000)"
              >
                <g
                  id="Google"
                  app-transform="translate(401.000000, 860.000000)"
                >
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
          <span className={"app-text-black"}>{t("common.continueWithGoogle")}</span>
          {/* Consider using a local or hosted image that represents "Sign in with Google" */}
        </button>
      </div>
      <div className="app-text-lg">
        {t("success.contactProblem")}{" "}
        <a className={"app-underline"} href={"mailto:contact@saferpdf.com"}>
          contact@saferpdf.com
        </a>
      </div>
    </div>
  );
};

const NoSubscription = ({ user, onRestored }) => {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [errorMsg, setErrorMsg] = useState("");

  const email = user?.firebaseUser?.email;

  const handleRestore = async () => {
    if (!email) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const restoreSubscription = httpsCallable(
        getFunctions(),
        "restoreSubscription",
      );
      await restoreSubscription();
      setStatus("done");
      onRestored();
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong.");
      setStatus("error");
    }
  };

  return (
    <div className="app-flex app-flex-col app-gap-4 app-max-w-screen-md app-w-full">
      <div className="app-text-lg app-font-semibold">No subscription found</div>
      {email && (
        <div className="app-flex app-flex-col app-gap-2">
          <p className="app-text-sm app-text-gray-600">
            Purchased with a different account? We'll look for a subscription
            linked to <strong>{email}</strong> and restore it here.
          </p>
          <button
            onClick={handleRestore}
            disabled={status === "loading" || status === "done"}
            className="app-px-5 app-py-2 app-bg-purple-900 app-text-white app-text-sm app-font-medium app-rounded-full hover:app-bg-purple-800 disabled:app-opacity-50 disabled:app-cursor-not-allowed app-w-fit"
          >
            {status === "loading"
              ? "Checking…"
              : status === "done"
                ? "Restored ✓"
                : "Restore my subscription"}
          </button>
          {status === "error" && (
            <p className="app-text-sm app-text-red-600">{errorMsg}</p>
          )}
        </div>
      )}
      <PurpleLink text="Go to pricing" link={"/pricing"} />
    </div>
  );
};

const Success = () => {
  const { t } = useTranslation();
  const { refreshAuth, loading, user } = useAuth();

  useEffect(() => {
    console.log("[Success] Component mounted, calling refreshAuth");
    refreshAuth();
  }, []);

  if (loading) {
    console.log("[Success] Still loading user data");
    return (
      <div className="app-flex app-justify-center app-items-center">
        <div className="app-text-lg app-font-semibold">{t("common.loading")}</div>
      </div>
    );
  }

  console.log("[Success] User data loaded:", {
    firebaseUser: user?.firebaseUser ? {
      uid: user.firebaseUser.uid,
      email: user.firebaseUser.email,
      isAnonymous: user.firebaseUser.isAnonymous,
      providerData: user.firebaseUser.providerData?.map(p => ({ providerId: p.providerId }))
    } : null,
    firestoreUser: user?.firestoreUser || null,
    firestoreUserMode: user?.firestoreUser?.mode,
    firestoreUserProductDescription: user?.firestoreUser?.productDescription
  });

  const unlinkDebug = () => {
    unlink(user.firebaseUser, new GoogleAuthProvider().providerId).then(
      console.log,
    );
  };

  if (!user.firestoreUser?.mode) {
    return <NoSubscription user={user} onRestored={refreshAuth} />;
  }
  
  console.log("[Success] Displaying subscription success for mode:", user.firestoreUser.mode);

  return (
    <div className="app-flex app-flex-col app-items-center app-justify-center app-gap-4">
      <div className="app-text-lg app-font-semibold app-max-w-screen-md app-w-full">
        <SuccessMessage
          purchaseType={user?.firestoreUser?.mode}
          product={user?.firestoreUser?.productDescription}
        />
      </div>
      {!user.firebaseUser.providerData.length && (
        <>
          {console.log("[Success] User is not linked with Google provider, showing auth prompt")}
          <PleaseAuth user={user.firebaseUser} />
        </>
      )}
      {user.firebaseUser.providerData.length > 0 && (
        console.log("[Success] User already linked with providers:", user.firebaseUser.providerData.map(p => p.providerId))
      )}
      {/*<div onClick={unlinkDebug}>Unlink</div>*/}
    </div>
  );
};

export default Success;
