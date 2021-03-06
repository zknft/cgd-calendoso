import { CalendarIcon, ClockIcon, CogIcon, LinkIcon, LogoutIcon, PuzzleIcon } from "@heroicons/react/solid";
import { signOut, useSession } from "next-auth/client";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { ReactNode, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

import LicenseBanner from "@ee/components/LicenseBanner";

import classNames from "@lib/classNames";
import { shouldShowOnboarding } from "@lib/getting-started";
import { useLocale } from "@lib/hooks/useLocale";
import { collectPageParameters, telemetryEventTypes, useTelemetry } from "@lib/telemetry";
import { trpc } from "@lib/trpc";

import Loader from "@components/Loader";
import { HeadSeo } from "@components/seo/head-seo";

import { useViewerI18n } from "./I18nLanguageHandler";
import Logo from "./Logo";

function useMeQuery() {
  const meQuery = trpc.useQuery(["viewer.me"], {
    retry(failureCount) {
      return failureCount > 3;
    },
  });

  return meQuery;
}

function useRedirectToLoginIfUnauthenticated() {
  const [session, loading] = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace({
        pathname: "/auth/login",
        query: {
          callbackUrl: `${location.pathname}${location.search}`,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session]);

  return {
    loading: loading && !session,
  };
}

function useRedirectToOnboardingIfNeeded() {
  const router = useRouter();
  const query = useMeQuery();
  const user = query.data;

  const [isRedirectingToOnboarding, setRedirecting] = useState(false);
  useEffect(() => {
    if (user && shouldShowOnboarding(user)) {
      setRedirecting(true);
    }
  }, [router, user]);
  useEffect(() => {
    if (isRedirectingToOnboarding) {
      router.replace({
        pathname: "/getting-started",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRedirectingToOnboarding]);
  return {
    isRedirectingToOnboarding,
  };
}

export function ShellSubHeading(props: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={classNames("block sm:flex justify-between mb-3", props.className)}>
      <div>
        <h2 className="flex items-center content-center space-x-2 text-base font-bold text-gray-900 leading-6">
          {props.title}
        </h2>
        {props.subtitle && <p className="mr-4 text-sm text-neutral-500">{props.subtitle}</p>}
      </div>
      {props.actions && <div className="flex-shrink-0 mb-4">{props.actions}</div>}
    </div>
  );
}

export default function Shell(props: {
  centered?: boolean;
  title?: string;
  heading: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  CTA?: ReactNode;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const { loading } = useRedirectToLoginIfUnauthenticated();
  const { isRedirectingToOnboarding } = useRedirectToOnboardingIfNeeded();

  const telemetry = useTelemetry();

  const navigation = [
    {
      name: t("event_types_page_title"),
      href: "/event-types",
      icon: LinkIcon,
      current: router.asPath.startsWith("/event-types"),
    },
    {
      name: t("bookings"),
      href: "/bookings/upcoming",
      icon: ClockIcon,
      current: router.asPath.startsWith("/bookings"),
    },
    {
      name: t("availability"),
      href: "/availability",
      icon: CalendarIcon,
      current: router.asPath.startsWith("/availability"),
    },
    {
      name: t("integrations"),
      href: "/integrations",
      icon: PuzzleIcon,
      current: router.asPath.startsWith("/integrations"),
    },
    // {
    //   name: t("settings"),
    //   href: "/settings/profile",
    //   icon: CogIcon,
    //   current: router.asPath.startsWith("/settings"),
    // },
  ];

  useEffect(() => {
    telemetry.withJitsu((jitsu) => {
      return jitsu.track(telemetryEventTypes.pageView, collectPageParameters(router.asPath));
    });
  }, [telemetry, router.asPath]);

  const pageTitle = typeof props.heading === "string" ? props.heading : props.title;

  const i18n = useViewerI18n();

  if (i18n.status === "loading" || isRedirectingToOnboarding || loading) {
    // show spinner whilst i18n is loading to avoid language flicker
    return (
      <div className="z-50 absolute w-full h-screen bg-gray-50 flex items-center">
        <Loader />
      </div>
    );
  }
  return (
    <>
      <HeadSeo
        title={pageTitle ?? "Cal.com"}
        description={props.subtitle ? props.subtitle?.toString() : ""}
        nextSeoProps={{
          nofollow: true,
          noindex: true,
        }}
      />
      <div>
        <Toaster position="bottom-right" />
      </div>

      <div className="flex h-screen overflow-hidden bg-gray-100">
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-56">
            <div className="flex flex-col flex-1 h-0 bg-white border-r border-gray-200">
              <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
                <Link href="/event-types">
                  <a className="px-4">
                    <Logo small />
                  </a>
                </Link>
                <nav className="flex-1 px-2 mt-5 space-y-1 bg-white">
                  {navigation.map((item) => (
                    <Link key={item.name} href={item.href}>
                      <a
                        className={classNames(
                          item.current
                            ? "bg-neutral-100 text-neutral-900"
                            : "text-neutral-500 hover:bg-gray-50 hover:text-neutral-900",
                          "group flex items-center px-2 py-2 text-sm font-medium rounded-sm"
                        )}>
                        <item.icon
                          className={classNames(
                            item.current
                              ? "text-neutral-500"
                              : "text-neutral-400 group-hover:text-neutral-500",
                            "mr-3 flex-shrink-0 h-5 w-5"
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </a>
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="p-2 pt-2 pr-2 hover:bg-gray-100 rounded-sm m-2">
                <UserDropdown />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none max-w-[1700px]">
            {/* show top navigation for md and smaller (tablet and phones) */}
            <nav className="flex items-center justify-between p-4 bg-white border-b border-gray-200 md:hidden">
              <Link href="/event-types">
                <a>
                  <Logo />
                </a>
              </Link>
              <div className="flex items-center self-center gap-3">
                <button className="p-2 text-gray-400 bg-white rounded-full hover:text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
                  <span className="sr-only">{t("view_notifications")}</span>
                  <Link href="/settings/profile">
                    <a>
                      <CogIcon className="w-6 h-6" aria-hidden="true" />
                    </a>
                  </Link>
                </button>
                <UserDropdown small />
              </div>
            </nav>
            <div className={classNames(props.centered && "md:max-w-5xl mx-auto", "py-8")}>
              <div className="block sm:flex justify-between px-4 sm:px-6 md:px-8 min-h-[80px]">
                <div className="w-full mb-8">
                  <h1 className="mb-1 text-xl font-bold tracking-wide text-gray-900 font-cal">
                    {props.heading}
                  </h1>
                  <p className="mr-4 text-sm text-neutral-500">{props.subtitle}</p>
                </div>
                <div className="flex-shrink-0 mb-4">{props.CTA}</div>
              </div>
              <div className="px-4 sm:px-6 md:px-8">{props.children}</div>
              {/* show bottom navigation for md and smaller (tablet and phones) */}
              <nav className="fixed bottom-0 flex w-full bg-white shadow bottom-nav md:hidden">
                {/* note(PeerRich): using flatMap instead of map to remove settings from bottom nav */}
                {navigation.flatMap((item, itemIdx) =>
                  item.href === "/settings/profile" ? (
                    []
                  ) : (
                    <Link key={item.name} href={item.href}>
                      <a
                        className={classNames(
                          item.current ? "text-gray-900" : "text-neutral-400 hover:text-gray-700",
                          itemIdx === 0 ? "rounded-l-lg" : "",
                          itemIdx === navigation.length - 1 ? "rounded-r-lg" : "",
                          "group relative min-w-0 flex-1 overflow-hidden bg-white py-2 px-2 text-xs sm:text-sm font-medium text-center hover:bg-gray-50 focus:z-10"
                        )}
                        aria-current={item.current ? "page" : undefined}>
                        <item.icon
                          className={classNames(
                            item.current ? "text-gray-900" : "text-gray-400 group-hover:text-gray-500",
                            "block mx-auto flex-shrink-0 h-5 w-5 mb-1 text-center"
                          )}
                          aria-hidden="true"
                        />
                        <span className="truncate">{item.name}</span>
                      </a>
                    </Link>
                  )
                )}
              </nav>
              {/* add padding to content for mobile navigation*/}
              <div className="block pt-12 md:hidden" />
            </div>
            <LicenseBanner />
          </main>
        </div>
      </div>
    </>
  );
}

function UserDropdown({ small }: { small?: boolean }) {
  const { t } = useLocale();
  const query = useMeQuery();
  const user = query.data;

  console.log(small);

  return user ? (
    <div className="flex items-center space-x-2 cursor-pointer group">
      <a
        onClick={() => signOut({ callbackUrl: "/auth/logout" })}
        className="flex px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 hover:text-gray-900">
        <LogoutIcon
          className={classNames("text-gray-500 group-hover:text-gray-700", "mr-2 flex-shrink-0 h-5 w-5")}
          aria-hidden="true"
        />
        {t("sign_out")}
      </a>
    </div>
  ) : null;
}
