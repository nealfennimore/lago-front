import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'
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
import { INTEGRATIONS_ROUTE, NOWPAYMENTS_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  AddNowpaymentsProviderDialogFragmentDoc,
  DeleteNowpaymentsIntegrationDialogFragmentDoc,
  NowpaymentsForCreateAndEditSuccessRedirectUrlFragmentDoc,
  NowpaymentsProvider,
  ProviderTypeEnum,
  useGetNowpaymentsIntegrationsListQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Nowpayments from '~/public/images/adyen.svg'
import {
  ItemContainer,
  ListItemLink,
  MenuPopper,
  NAV_HEIGHT,
  PageHeader,
  PopperOpener,
  theme,
} from '~/styles'

gql`
  fragment NowpaymentsIntegrations on NowpaymentsProvider {
    id
    name
    code
  }

  query getNowpaymentsIntegrationsList($limit: Int, $type: ProviderTypeEnum) {
    paymentProviders(limit: $limit, type: $type) {
      collection {
        ... on NowpaymentsProvider {
          id
          ...NowpaymentsIntegrations
          ...AddNowpaymentsProviderDialog
          ...DeleteNowpaymentsIntegrationDialog
        }
      }
    }
  }

  ${NowpaymentsForCreateAndEditSuccessRedirectUrlFragmentDoc}
  ${DeleteNowpaymentsIntegrationDialogFragmentDoc}
  ${AddNowpaymentsProviderDialogFragmentDoc}
`

const NowpaymentsIntegrations = () => {
  const navigate = useNavigate()
  const addNowpaymentsDialogRef = useRef<AddNowpaymentsDialogRef>(null)
  const deleteDialogRef = useRef<DeleteNowpaymentsIntegrationDialogRef>(null)
  const successRedirectUrlDialogRef = useRef<AddEditDeleteSuccessRedirectUrlDialogRef>(null)
  const { translate } = useInternationalization()
  const { data, loading } = useGetNowpaymentsIntegrationsListQuery({
    variables: { limit: 1000, type: ProviderTypeEnum.Nowpayments },
  })
  const connections = data?.paymentProviders?.collection as NowpaymentsProvider[] | undefined
  const deleteDialogCallback =
    connections && connections.length === 1 ? () => navigate(INTEGRATIONS_ROUTE) : undefined

  return (
    <>
      <PageHeader $withSide>
        <HeaderBlock>
          <ButtonLink
            to={INTEGRATIONS_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {loading ? (
            <Skeleton variant="text" height={12} width={120} />
          ) : (
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_645d071272418a14c1c76a6d')}
            </Typography>
          )}
        </HeaderBlock>
        <Button
          variant="primary"
          onClick={() => {
            addNowpaymentsDialogRef.current?.openDialog()
          }}
        >
          {translate('text_65846763e6140b469140e235')}
        </Button>
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
                <Typography variant="headline">
                  {translate('text_645d071272418a14c1c76a6d')}
                </Typography>
                <Chip label={translate('text_62b1edddbf5f461ab971270d')} />
              </Line>
              <Typography>{translate('text_62b1edddbf5f461ab971271f')}</Typography>
            </div>
          </>
        )}
      </MainInfos>

      <ListWrapper>
        <section>
          <InlineTitle>
            <Typography variant="subhead">{translate('text_65846763e6140b469140e239')}</Typography>
          </InlineTitle>

          <>
            {loading ? (
              <>
                {[1, 2].map((i) => (
                  <ListItem key={`item-skeleton-item-${i}`}>
                    <Skeleton variant="connectorAvatar" size="big" marginRight="16px" />
                    <Skeleton variant="text" width={240} height={12} />
                  </ListItem>
                ))}
              </>
            ) : (
              <>
                {connections?.map((connection, index) => {
                  return (
                    <ItemContainer key={`adyen-connection-${index}`}>
                      <LocalListItemLink
                        tabIndex={0}
                        to={generatePath(NOWPAYMENTS_INTEGRATION_DETAILS_ROUTE, {
                          integrationId: connection.id,
                        })}
                      >
                        <Stack direction="row" spacing={3}>
                          <Avatar variant="connector" size="big">
                            <Icon name="plug" color="dark" />
                          </Avatar>
                          <div>
                            <Typography variant="body" color="grey700">
                              {connection.name}
                            </Typography>
                            <Typography variant="caption" color="grey600">
                              {connection.code}
                            </Typography>
                          </div>
                          <ButtonMock />
                        </Stack>
                      </LocalListItemLink>
                      <Popper
                        PopperProps={{ placement: 'bottom-end' }}
                        opener={({ isOpen }) => (
                          <LocalPopperOpener>
                            <Tooltip
                              placement="top-end"
                              disableHoverListener={isOpen}
                              title={translate('text_626162c62f790600f850b7b6')}
                            >
                              <Button
                                icon="dots-horizontal"
                                variant="quaternary"
                                data-test="plan-item-options"
                              />
                            </Tooltip>
                          </LocalPopperOpener>
                        )}
                      >
                        {({ closePopper }) => (
                          <MenuPopper>
                            <Button
                              startIcon="pen"
                              variant="quaternary"
                              align="left"
                              onClick={() => {
                                addNowpaymentsDialogRef.current?.openDialog({
                                  provider: connection,
                                  deleteModalRef: deleteDialogRef,
                                  deleteDialogCallback,
                                })
                                closePopper()
                              }}
                            >
                              {translate('text_65845f35d7d69c3ab4793dac')}
                            </Button>
                            <Button
                              startIcon="trash"
                              variant="quaternary"
                              align="left"
                              onClick={() => {
                                deleteDialogRef.current?.openDialog({
                                  provider: connection,
                                  callback: deleteDialogCallback,
                                })
                                closePopper()
                              }}
                            >
                              {translate('text_645d071272418a14c1c76a81')}
                            </Button>
                          </MenuPopper>
                        )}
                      </Popper>
                    </ItemContainer>
                  )
                })}
              </>
            )}
          </>
        </section>
      </ListWrapper>

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

const ListWrapper = styled.div`
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

const LocalListItemLink = styled(ListItemLink)`
  padding: 0;
`

const ListItem = styled.div`
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

const ButtonMock = styled.div`
  width: 40px;
  min-width: 40px;
`

const LocalPopperOpener = styled(PopperOpener)`
  right: 0;
`

export default NowpaymentsIntegrations
