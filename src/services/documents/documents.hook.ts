import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { env } from '@/env'
import { useMeQuery } from '@/services/auth/hooks/auth.hook'
import { documentsKeys } from '@/services/queryKeys'

import {
  createMockDocumentMutation,
  getMockDocumentById,
  getMockDocumentVersions,
  getMockDocumentsList,
  updateMockDocumentMutation,
} from './documents.mock'
import { useDocumentsQuery } from './documents.query'
import type { CreateDocumentInput, PatchDocumentInput } from './documents.type'

const isMockDocuments = (): boolean => env.VITE_MOCK_DOCUMENTS

export { documentsKeys }

export const useDocumentsListQuery = () => {
  const { data: me, isPending: isMePending } = useMeQuery()
  const documents = useDocumentsQuery()
  const mock = isMockDocuments()

  return useQuery({
    enabled: !isMePending && me != null,
    queryKey: documentsKeys.list,
    queryFn: () => (mock ? getMockDocumentsList() : documents.list()),
  })
}

export const useDocumentQuery = (id: string) => {
  const { data: me, isPending: isMePending } = useMeQuery()
  const documents = useDocumentsQuery()
  const mock = isMockDocuments()

  return useQuery({
    enabled: !isMePending && me != null && Boolean(id),
    queryKey: documentsKeys.detail(id),
    queryFn: () => (mock ? getMockDocumentById(id) : documents.getById(id)),
  })
}

export const useDocumentVersionsQuery = (id: string) => {
  const { data: me, isPending: isMePending } = useMeQuery()
  const documents = useDocumentsQuery()
  const mock = isMockDocuments()

  return useQuery({
    enabled: !isMePending && me != null && Boolean(id),
    queryKey: documentsKeys.versions(id),
    queryFn: () =>
      mock ? getMockDocumentVersions(id) : documents.listVersions(id),
  })
}

export const useCreateDocumentMutation = () => {
  const queryClient = useQueryClient()
  const documents = useDocumentsQuery()
  const mock = isMockDocuments()

  return useMutation({
    mutationFn: (input: CreateDocumentInput) =>
      mock ? createMockDocumentMutation(input) : documents.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: documentsKeys.list })
    },
  })
}

export const useUpdateDocumentMutation = () => {
  const queryClient = useQueryClient()
  const documents = useDocumentsQuery()
  const mock = isMockDocuments()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PatchDocumentInput }) =>
      mock
        ? updateMockDocumentMutation(id, input)
        : documents.update(id, input),
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: documentsKeys.list })
      await queryClient.invalidateQueries({
        queryKey: documentsKeys.detail(id),
      })
      await queryClient.invalidateQueries({
        queryKey: documentsKeys.versions(id),
      })
    },
  })
}
