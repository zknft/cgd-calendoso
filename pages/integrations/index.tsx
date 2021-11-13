import React from "react";

import { QueryCell } from "@lib/QueryCell";
import { useLocale } from "@lib/hooks/useLocale";
import { trpc } from "@lib/trpc";

import { ClientSuspense } from "@components/ClientSuspense";
import { List } from "@components/List";
import Loader from "@components/Loader";
import Shell, { ShellSubHeading } from "@components/Shell";
import { CalendarListContainer } from "@components/integrations/CalendarListContainer";
import ConnectIntegration from "@components/integrations/ConnectIntegrations";
import DisconnectIntegration from "@components/integrations/DisconnectIntegration";
import IntegrationListItem from "@components/integrations/IntegrationListItem";
import SubHeadingTitleWithConnections from "@components/integrations/SubHeadingTitleWithConnections";
import { Alert } from "@components/ui/Alert";
import Button from "@components/ui/Button";

function ConnectOrDisconnectIntegrationButton(props: {
  //
  credentialIds: number[];
  type: string;
  installed: boolean;
}) {
  const { t } = useLocale();
  const [credentialId] = props.credentialIds;
  const utils = trpc.useContext();
  const handleOpenChange = () => {
    utils.invalidateQueries(["viewer.integrations"]);
  };

  if (credentialId) {
    return (
      <DisconnectIntegration
        id={credentialId}
        render={(btnProps) => (
          <Button {...btnProps} color="warn">
            {t("disconnect")}
          </Button>
        )}
        onOpenChange={handleOpenChange}
      />
    );
  }
  if (!props.installed) {
    return (
      <div className="flex items-center truncate">
        <Alert severity="warning" title={t("not_installed")} />
      </div>
    );
  }
  /** We don't need to "Connect", just show that it's installed */
  if (props.type === "daily_video") {
    return (
      <div className="px-3 py-2 truncate">
        <h3 className="text-sm font-medium text-gray-700">{t("installed")}</h3>
      </div>
    );
  }
  return (
    <ConnectIntegration
      type={props.type}
      render={(btnProps) => (
        <Button color="secondary" {...btnProps}>
          {t("connect")}
        </Button>
      )}
      onOpenChange={handleOpenChange}
    />
  );
}

function IntegrationsContainer() {
  const { t } = useLocale();
  const query = trpc.useQuery(["viewer.integrations"], { suspense: true });
  return (
    <QueryCell
      query={query}
      success={({ data }) => (
        <>
          <ShellSubHeading
            title={
              <SubHeadingTitleWithConnections
                title={t("conferencing")}
                numConnections={data.conferencing.numActive}
              />
            }
          />
          <List>
            {data.conferencing.items.map((item) => (
              <IntegrationListItem
                key={item.title}
                {...item}
                actions={<ConnectOrDisconnectIntegrationButton {...item} />}
              />
            ))}
          </List>

          <ShellSubHeading
            className="mt-10"
            title={
              <SubHeadingTitleWithConnections title={t("payment")} numConnections={data.payment.numActive} />
            }
          />
          <List>
            {data.payment.items.map((item) => (
              <IntegrationListItem
                key={item.title}
                {...item}
                actions={<ConnectOrDisconnectIntegrationButton {...item} />}
              />
            ))}
          </List>
        </>
      )}></QueryCell>
  );
}

export default function IntegrationsPage() {
  const { t } = useLocale();

  return (
    <Shell heading={t("integrations")} subtitle={t("connect_your_favourite_apps")}>
      <ClientSuspense fallback={<Loader />}>
        <IntegrationsContainer />
        <CalendarListContainer />
      </ClientSuspense>
    </Shell>
  );
}
