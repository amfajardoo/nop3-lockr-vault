export interface NavItem {
  label: string;
  route: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [{ label: "Overview", route: "/", icon: "vault" }];
