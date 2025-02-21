export interface LinkItem {
  url: string | null;
  label: string;
}

export interface PopupLinksProps {
  isOpen: boolean;
  onClose: () => void;
  links: LinkItem[];
  title: string;
} 