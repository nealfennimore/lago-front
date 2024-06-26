import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useFormik } from 'formik'
import { forwardRef, RefObject, useImperativeHandle, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { generatePath } from 'react-router-dom'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { NOWPAYMENTS_INTEGRATION_DETAILS_ROUTE } from '~/core/router'
import {
  AddNowpaymentsPaymentProviderInput,
  AddNowpaymentsProviderDialogFragment,
  LagoApiError,
  NowpaymentsIntegrationDetailsFragmentDoc,
  useAddNowpaymentsApiKeyMutation,
  useGetProviderByCodeForNowpaymentsLazyQuery,
  useUpdateNowpaymentsApiKeyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { DeleteNowpaymentsIntegrationDialogRef } from './DeleteNowpaymentsIntegrationDialog'

gql`
  fragment AddNowpaymentsProviderDialog on NowpaymentsProvider {
    id
    name
    code
    apiKey
    hmacKey
    successRedirectUrl
    cancelRedirectUrl
    partiallyPaidRedirectUrl
    ipnCallbackUrl
  }

  query getProviderByCodeForNowpayments($code: String) {
    paymentProvider(code: $code) {
      ... on AdyenProvider {
        id
      }
      ... on GocardlessProvider {
        id
      }
      ... on StripeProvider {
        id
      }
      ... on NowpaymentsProvider {
        id
      }
    }
  }

  mutation addNowpaymentsApiKey($input: AddNowpaymentsPaymentProviderInput!) {
    addNowpaymentsPaymentProvider(input: $input) {
      id

      ...AddNowpaymentsProviderDialog
      ...NowpaymentsIntegrationDetails
    }
  }

  mutation updateNowpaymentsApiKey($input: UpdateNowpaymentsPaymentProviderInput!) {
    updateNowpaymentsPaymentProvider(input: $input) {
      id

      ...AddNowpaymentsProviderDialog
      ...NowpaymentsIntegrationDetails
    }
  }

  ${NowpaymentsIntegrationDetailsFragmentDoc}
`

type TAddNowpaymentsDialogProps = Partial<{
  deleteModalRef: RefObject<DeleteNowpaymentsIntegrationDialogRef>
  provider: AddNowpaymentsProviderDialogFragment
  deleteDialogCallback: Function
}>

export interface AddNowpaymentsDialogRef {
  openDialog: (props?: TAddNowpaymentsDialogProps) => unknown
  closeDialog: () => unknown
}

export const AddNowpaymentsDialog = forwardRef<AddNowpaymentsDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<TAddNowpaymentsDialogProps | undefined>(undefined)
  const nowpaymentsProvider = localData?.provider
  const isEdition = !!nowpaymentsProvider

  const [addApiKey] = useAddNowpaymentsApiKeyMutation({
    onCompleted({ addNowpaymentsPaymentProvider }) {
      if (addNowpaymentsPaymentProvider?.id) {
        navigate(
          generatePath(NOWPAYMENTS_INTEGRATION_DETAILS_ROUTE, {
            integrationId: addNowpaymentsPaymentProvider.id,
          }),
        )

        addToast({
          message: translate('text_645d071272418a14c1c76a93'),
          severity: 'success',
        })
      }
    },
  })

  const [updateApiKey] = useUpdateNowpaymentsApiKeyMutation({
    onCompleted({ updateNowpaymentsPaymentProvider }) {
      if (updateNowpaymentsPaymentProvider?.id) {
        addToast({
          message: translate('text_645d071272418a14c1c76a3e'),
          severity: 'success',
        })
      }
    },
  })

  const [getNowpaymentsProviderByCode] = useGetProviderByCodeForNowpaymentsLazyQuery()

  const formikProps = useFormik<AddNowpaymentsPaymentProviderInput>({
    initialValues: {
      name: nowpaymentsProvider?.name || '',
      code: nowpaymentsProvider?.code || '',
      apiKey: nowpaymentsProvider?.apiKey || '',
      hmacKey: nowpaymentsProvider?.hmacKey || undefined,
      ipnCallbackUrl: nowpaymentsProvider?.ipnCallbackUrl || undefined,
      successRedirectUrl: nowpaymentsProvider?.successRedirectUrl || undefined,
      cancelRedirectUrl: nowpaymentsProvider?.cancelRedirectUrl || undefined,
      partiallyPaidRedirectUrl: nowpaymentsProvider?.partiallyPaidRedirectUrl || undefined,
    },
    validationSchema: object().shape({
      name: string(),
      code: string().required(''),
      apiKey: string().required(''),
      hmacKey: string(),
      ipnCallbackUrl: string(),
      successRedirectUrl: string(),
      cancelRedirectUrl: string(),
      partiallyPaidRedirectUrl: string(),
    }),
    onSubmit: async ({ apiKey, hmacKey, ...values }, formikBag) => {
      const res = await getNowpaymentsProviderByCode({
        context: { silentErrorCodes: [LagoApiError.NotFound] },
        variables: {
          code: values.code,
        },
      })
      const isNotAllowedToMutate =
        (!!res.data?.paymentProvider?.id && !isEdition) ||
        (isEdition &&
          !!res.data?.paymentProvider?.id &&
          res.data?.paymentProvider?.id !== nowpaymentsProvider?.id)

      if (isNotAllowedToMutate) {
        formikBag.setFieldError('code', translate('text_632a2d437e341dcc76817556'))
        return
      }

      if (isEdition) {
        await updateApiKey({
          variables: {
            input: {
              ...values,
              id: nowpaymentsProvider?.id || '',
            },
          },
        })
      } else {
        await addApiKey({
          variables: {
            input: { ...values, apiKey, hmacKey },
          },
        })
      }

      dialogRef.current?.closeDialog()
    },
    validateOnMount: true,
    enableReinitialize: true,
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setLocalData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <Dialog
      ref={dialogRef}
      title={translate(
        isEdition ? 'text_658461066530343fe1808cd9' : 'text_658466afe6140b469140e1fa',
        {
          name: nowpaymentsProvider?.name,
        },
      )}
      description={translate(
        isEdition ? 'text_65846a0ed9fdbd46c4afc42d' : 'text_658466afe6140b469140e1fc',
      )}
      onClose={formikProps.resetForm}
      actions={({ closeDialog }) => (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          width={isEdition ? '100%' : 'inherit'}
          spacing={3}
        >
          {isEdition && (
            <Button
              danger
              variant="quaternary"
              onClick={() => {
                closeDialog()
                localData?.deleteModalRef?.current?.openDialog({
                  provider: nowpaymentsProvider,
                  callback: localData.deleteDialogCallback,
                })
              }}
            >
              {translate('text_65845f35d7d69c3ab4793dad')}
            </Button>
          )}
          <Stack direction="row" spacing={3} alignItems="center">
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_63eba8c65a6c8043feee2a14')}
            </Button>
            <Button
              variant="primary"
              disabled={!formikProps.isValid || !formikProps.dirty}
              onClick={formikProps.submitForm}
            >
              {translate(
                isEdition ? 'text_645d071272418a14c1c76a67' : 'text_645d071272418a14c1c76ad8',
              )}
            </Button>
          </Stack>
        </Stack>
      )}
    >
      <Content>
        <InlineInputs>
          <TextInputField
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            formikProps={formikProps}
            name="name"
            label={translate('text_6584550dc4cec7adf861504d')}
            placeholder={translate('text_6584550dc4cec7adf861504f')}
          />
          <TextInputField
            formikProps={formikProps}
            name="code"
            label={translate('text_6584550dc4cec7adf8615051')}
            placeholder={translate('text_6584550dc4cec7adf8615053')}
          />
        </InlineInputs>

        <TextInputField
          name="apiKey"
          disabled={isEdition}
          label={translate('text_645d071272418a14c1c76a77')}
          placeholder={translate('text_645d071272418a14c1c76a83')}
          formikProps={formikProps}
        />
        {(!isEdition || !!nowpaymentsProvider.hmacKey) && (
          <TextInputField
            name="hmacKey"
            disabled={isEdition}
            label={translate('text_645d071272418a14c1c76aba')}
            placeholder={translate('text_645d071272418a14c1c76ac4')}
            formikProps={formikProps}
          />
        )}
        <TextInputField
          name="ipnCallbackUrl"
          label={"ipnCallbackUrl"}
          placeholder={""}
          formikProps={formikProps}
        />
        <TextInputField
          name="successRedirectUrl"
          label={"successRedirectUrl"}
          placeholder={""}
          formikProps={formikProps}
        />
        <TextInputField
          name="cancelRedirectUrl"
          label={"cancelRedirectUrl"}
          placeholder={""}
          formikProps={formikProps}
        />
        <TextInputField
          name="partiallyPaidRedirectUrl"
          label={"partiallyPaidRedirectUrl"}
          placeholder={""}
          formikProps={formikProps}
        />
      </Content>
    </Dialog>
  )
})

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const InlineInputs = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: ${theme.spacing(6)};

  > * {
    flex: 1;
  }
`

AddNowpaymentsDialog.displayName = 'AddNowpaymentsDialog'
