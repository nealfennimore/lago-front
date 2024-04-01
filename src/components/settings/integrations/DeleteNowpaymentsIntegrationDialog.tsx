import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  DeleteNowpaymentsIntegrationDialogFragment,
  useDeleteNowpaymentsIntegrationMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment DeleteNowpaymentsIntegrationDialog on NowpaymentsProvider {
    id
    name
  }

  mutation deleteNowpaymentsIntegration($input: DestroyPaymentProviderInput!) {
    destroyPaymentProvider(input: $input) {
      id
    }
  }
`

type TDeleteNowpaymentsIntegrationDialogProps = {
  provider: DeleteNowpaymentsIntegrationDialogFragment | null
  callback?: Function
}

export interface DeleteNowpaymentsIntegrationDialogRef {
  openDialog: ({ provider, callback }: TDeleteNowpaymentsIntegrationDialogProps) => unknown
  closeDialog: () => unknown
}

export const DeleteNowpaymentsIntegrationDialog = forwardRef<DeleteNowpaymentsIntegrationDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()

    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<TDeleteNowpaymentsIntegrationDialogProps | undefined>(
      undefined,
    )
    const nowpaymentsProvider = localData?.provider

    const [deleteNowpayments] = useDeleteNowpaymentsIntegrationMutation({
      onCompleted(data) {
        if (data && data.destroyPaymentProvider) {
          dialogRef.current?.closeDialog()
          localData?.callback?.()
          addToast({
            message: translate('text_645d071272418a14c1c76b25'),
            severity: 'success',
          })
        }
      },
      update(cache) {
        cache.evict({ id: `NowpaymentsProvider:${nowpaymentsProvider?.id}` })
      },
    })

    useImperativeHandle(ref, () => ({
      openDialog: (data) => {
        setLocalData(data)
        dialogRef.current?.openDialog()
      },
      closeDialog: () => dialogRef.current?.closeDialog(),
    }))

    return (
      <WarningDialog
        ref={dialogRef}
        title={translate('text_658461066530343fe1808cd7', { name: nowpaymentsProvider?.name })}
        description={translate('text_658461066530343fe1808cc2')}
        onContinue={async () =>
          await deleteNowpayments({ variables: { input: { id: nowpaymentsProvider?.id as string } } })
        }
        continueText={translate('text_645d071272418a14c1c76a81')}
      />
    )
  },
)

DeleteNowpaymentsIntegrationDialog.displayName = 'DeleteNowpaymentsIntegrationDialog'
