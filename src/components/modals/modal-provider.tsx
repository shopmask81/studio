
'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Product } from '@/lib/types';
import { SelectVariantModal } from './select-variant-modal';

type ModalType = 'selectVariant';

type ModalPayload = {
  selectVariant: {
    product: Product;
  };
};

type ModalContextType = {
  showModal: <T extends ModalType>(modalType: T, payload: ModalPayload[T]) => void;
  hideModal: () => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [modalProps, setModalProps] = useState<any>({});

  const showModal = <T extends ModalType>(modalType: T, payload: ModalPayload[T]) => {
    setModalType(modalType);
    setModalProps(payload);
  };

  const hideModal = () => {
    setModalType(null);
    setModalProps({});
  };

  const renderModal = () => {
    switch (modalType) {
      case 'selectVariant':
        return <SelectVariantModal isOpen={true} onOpenChange={hideModal} product={modalProps.product} />;
      default:
        return null;
    }
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {renderModal()}
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
