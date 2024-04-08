import { gql } from '@apollo/client'
import { useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import {
  Avatar,
  Button,
  ButtonLink,
  Chip,
  Icon,
  Popper,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import {
  AddEditDeleteSuccessRedirectUrlDialog,
  AddEditDeleteSuccessRedirectUrlDialogRef,
} from '~/components/settings/integrations/AddEditDeleteSuccessRedirectUrlDialog'
import {
  AddNowpaymentsDialog,
  AddNowpaymentsDialogRef,
} from '~/components/settings/integrations/AddNowpaymentsDialog'
import {
  DeleteNowpaymentsIntegrationDialog,
  DeleteNowpaymentsIntegrationDialogRef,
} from '~/components/settings/integrations/DeleteNowpaymentsIntegrationDialog'
import { INTEGRATIONS_ROUTE, NOWPAYMENTS_INTEGRATION_ROUTE } from '~/core/router'
import {
  AddNowpaymentsProviderDialogFragmentDoc,
  DeleteNowpaymentsIntegrationDialogFragmentDoc,
  NowpaymentsForCreateAndEditSuccessRedirectUrlFragmentDoc,
  NowpaymentsIntegrationDetailsFragment,
  ProviderTypeEnum,
  useGetNowpaymentsIntegrationsDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Nowpayments from '~/public/images/nowpayments.svg'
import { MenuPopper, NAV_HEIGHT, PageHeader, PopperOpener, theme } from '~/styles'

const PROVIDER_CONNECTION_LIMIT = 2

gql`
  fragment NowpaymentsIntegrationDetails on NowpaymentsProvider {
    id
    apiKey
    code
    hmacKey
    successRedirectUrl
    name
    cancelRedirectUrl
    partiallyPaidRedirectUrl
    ipnCallbackUrl
  }

  query getNowpaymentsIntegrationsDetails($id: ID!, $limit: Int, $type: ProviderTypeEnum) {
    paymentProvider(id: $id) {
      ... on NowpaymentsProvider {
        id
        ...NowpaymentsIntegrationDetails
        ...DeleteNowpaymentsIntegrationDialog
        ...AddNowpaymentsProviderDialog
        ...NowpaymentsForCreateAndEditSuccessRedirectUrl
      }
    }

    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on NowpaymentsProvider {
          id
        }
      }
    }
  }

  ${NowpaymentsForCreateAndEditSuccessRedirectUrlFragmentDoc}
  ${DeleteNowpaymentsIntegrationDialogFragmentDoc}
  ${AddNowpaymentsProviderDialogFragmentDoc}
`

const NowpaymentsIntegrationDetails = () => {
  const navigate = useNavigate()
  const { integrationId } = useParams()
  const addNowpaymentsDialogRef = useRef<AddNowpaymentsDialogRef>(null)
  const deleteDialogRef = useRef<DeleteNowpaymentsIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetNowpaymentsIntegrationsDetailsQuery({
    variables: {
      id: integrationId as string,
      limit: PROVIDER_CONNECTION_LIMIT,
      type: ProviderTypeEnum.Nowpayments,
    },
    skip: !integrationId,
  })
  const nowpaymentsProvider = data?.paymentProvider as NowpaymentsIntegrationDetailsFragment
  const deleteDialogCallback = () => {
    if (data?.paymentProviders?.collection.length === PROVIDER_CONNECTION_LIMIT) {
      navigate(NOWPAYMENTS_INTEGRATION_ROUTE)
    } else {
      navigate(INTEGRATIONS_ROUTE)
    }
  }

  return (
    <>
      <PageHeader $withSide>
        <HeaderBlock>
          <ButtonLink
            to={NOWPAYMENTS_INTEGRATION_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" height={12} width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {nowpaymentsProvider?.name}
            </Typography>
          )}
        </HeaderBlock>
        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={
            <Button endIcon="chevron-down">{translate('text_626162c62f790600f850b6fe')}</Button>
          }
        >
          {({ closePopper }) => (
            <MenuPopper>
              <Button
                variant="quaternary"
                fullWidth
                align="left"
                onClick={() => {
                  addNowpaymentsDialogRef.current?.openDialog({
                    provider: nowpaymentsProvider,
                    deleteModalRef: deleteDialogRef,
                    deleteDialogCallback,
                  })
                  closePopper()
                }}
              >
                {translate('text_65845f35d7d69c3ab4793dac')}
              </Button>
              <Button
                variant="quaternary"
                align="left"
                fullWidth
                onClick={() => {
                  deleteDialogRef.current?.openDialog({
                    provider: nowpaymentsProvider,
                    callback: deleteDialogCallback,
                  })
                  closePopper()
                }}
              >
                {translate('text_65845f35d7d69c3ab4793dad')}
              </Button>
            </MenuPopper>
          )}
        </Popper>
      </PageHeader>

      <MainInfos>
        {loading ? (
          <>
            <Skeleton variant="connectorAvatar" size="large" marginRight="16px" />
            <div>
              <Skeleton variant="text" width={200} height={12} marginBottom="22px" />
              <Skeleton variant="text" width={128} height={12} />
            </div>
          </>
        ) : (
          <>
            <StyledAvatar variant="connector" size="large">
              <Nowpayments />
            </StyledAvatar>
            <div>
              <Line>
                <Typography variant="headline">{nowpaymentsProvider?.name}</Typography>
                <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
              </Line>
              <Typography>
                {translate('text_645d071272418a14c1c76a6d')}&nbsp;•&nbsp;
                {translate('text_62b1edddbf5f461ab971271f')}
              </Typography>
            </div>
          </>
        )}
      </MainInfos>

      <Settings>
        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_645d071272418a14c1c76a9a')}</Typography>
            <Button
              variant="quaternary"
              disabled={loading}
              onClick={() => {
                addNowpaymentsDialogRef.current?.openDialog({
                  provider: nowpaymentsProvider,
                  deleteModalRef: deleteDialogRef,
                  deleteDialogCallback,
                })
              }}
            >
              {translate('text_62b1edddbf5f461ab9712787')}
            </Button>
          </InlineTitle>

          <>
            {loading ? (
              <>
                {[0, 1, 2].map((i) => (
                  <ApiKeyItem key={`item-skeleton-item-${i}`}>
                    <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
                    <Skeleton variant="text" width={240} height={12} />
                  </ApiKeyItem>
                ))}
              </>
            ) : (
              <>
                <ApiKeyItem>
                  <Avatar variant="connector" size="big">
                    <Icon name="text" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_626162c62f790600f850b76a')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {nowpaymentsProvider?.name}
                    </Typography>
                  </div>
                </ApiKeyItem>
                <ApiKeyItem>
                  <Avatar variant="connector" size="big">
                    <Icon name="id" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_62876e85e32e0300e1803127')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {nowpaymentsProvider?.code}
                    </Typography>
                  </div>
                </ApiKeyItem>
                <ApiKeyItem>
                  <Avatar variant="connector" size="big">
                    <Icon name="key" color="dark" />
                  </Avatar>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_645d071272418a14c1c76aa4')}
                    </Typography>
                    <Typography variant="body" color="grey700">
                      {nowpaymentsProvider?.apiKey}
                    </Typography>
                  </div>
                </ApiKeyItem>
                {!!nowpaymentsProvider?.hmacKey && (
                  <ApiKeyItem>
                    <Avatar variant="connector" size="big">
                      <Icon name="info-circle" color="dark" />
                    </Avatar>
                    <div>
                      <Typography variant="caption" color="grey600">
                        {translate('text_645d071272418a14c1c76ae0')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {nowpaymentsProvider?.hmacKey}
                      </Typography>
                    </div>
                  </ApiKeyItem>
                )}
              </>
            )}
          </>
        </section>

        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_65367cb78324b77fcb6af21c')}</Typography>
            <Button
              variant="quaternary"
              disabled={!!nowpaymentsProvider?.successRedirectUrl}
              onClick={() => {
                successRedirectUrlDialogRef.current?.openDialog({
                  mode: 'Add',
                  type: 'Nowpayments',
                  provider: nowpaymentsProvider,
                })
              }}
            >
              {translate('text_65367cb78324b77fcb6af20e')}
            </Button>
          </InlineTitle>

          {loading ? (
            <HeaderBlock>
              <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
              <Skeleton variant="text" width={240} height={12} />
            </HeaderBlock>
          ) : (
            <>
              {!nowpaymentsProvider?.successRedirectUrl ? (
                <Typography variant="caption" color="grey600">
                  {translate('text_65367cb78324b77fcb6af226', {
                    connectionName: translate('text_645d071272418a14c1c76a6d'),
                  })}
                </Typography>
              ) : (
                <SuccessPaumentRedirectUrlItem>
                  <SuccessPaumentRedirectUrlItemLeft>
                    <Avatar variant="connector" size="big">
                      <Icon name="globe" color="dark" />
                    </Avatar>
                    <div>
                      <Typography variant="caption" color="grey600">
                        {translate('text_65367cb78324b77fcb6af1c6')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {nowpaymentsProvider?.successRedirectUrl}
                      </Typography>
                    </div>
                  </SuccessPaumentRedirectUrlItemLeft>
                  <LocalPopper
                    PopperProps={{ placement: 'bottom-end' }}
                    opener={({ isOpen }) => (
                      <PopperOpener>
                        <Tooltip
                          placement="top-end"
                          disableHoverListener={isOpen}
                          title={translate('text_629728388c4d2300e2d3810d')}
                        >
                          <Button icon="dots-horizontal" variant="quaternary" />
                        </Tooltip>
                      </PopperOpener>
                    )}
                  >
                    {({ closePopper }) => (
                      <MenuPopper>
                        <Button
                          startIcon="pen"
                          variant="quaternary"
                          fullWidth
                          align="left"
                          onClick={() => {
                            successRedirectUrlDialogRef.current?.openDialog({
                              mode: 'Edit',
                              type: 'Nowpayments',
                              provider: nowpaymentsProvider,
                            })
                            closePopper()
                          }}
                        >
                          {translate('text_65367cb78324b77fcb6af24d')}
                        </Button>
                        <Button
                          startIcon="trash"
                          variant="quaternary"
                          align="left"
                          fullWidth
                          onClick={() => {
                            successRedirectUrlDialogRef.current?.openDialog({
                              mode: 'Delete',
                              type: 'Nowpayments',
                              provider: nowpaymentsProvider,
                            })
                            closePopper()
                          }}
                        >
                          {translate('text_65367cb78324b77fcb6af243')}
                        </Button>
                      </MenuPopper>
                    )}
                  </LocalPopper>
                </SuccessPaumentRedirectUrlItem>
              )}
            </>
          )}
        </section>
      </Settings>

      <AddNowpaymentsDialog ref={addNowpaymentsDialogRef} />
      <DeleteNowpaymentsIntegrationDialog ref={deleteDialogRef} />
      <AddEditDeleteSuccessRedirectUrlDialog ref={successRedirectUrlDialogRef} />
    </>
  )
}

const HeaderBlock = styled.div`
  display: flex;
  align-items: center;

  > *:first-child  {
    margin-right: ${theme.spacing(3)};
  }
`

const MainInfos = styled.div`
  display: flex;
  align-items: center;
  padding: ${theme.spacing(8)} ${theme.spacing(12)};
`

const Settings = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(8)};
  margin: 0 ${theme.spacing(12)};
  box-sizing: border-box;
  max-width: ${theme.spacing(168)};
`

const InlineTitle = styled.div`
  position: relative;
  height: ${NAV_HEIGHT}px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const LocalPopper = styled(Popper)`
  position: relative;
  height: 100%;
  > *:first-child {
    right: 0;
    top: 16px;
  }
`

const SuccessPaumentRedirectUrlItem = styled.div`
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const SuccessPaumentRedirectUrlItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
`

const ApiKeyItem = styled.div`
  height: ${NAV_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const StyledAvatar = styled(Avatar)`
  margin-right: ${theme.spacing(4)};
`

const Line = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(2)};
  }
`

export default NowpaymentsIntegrationDetails
