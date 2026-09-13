import type { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./dashboard/dashboard").then((m) => m.Dashboard),
    children: [
      {
        path: "",
        loadComponent: () =>
          import("./credential-list/credential-list").then((m) => m.CredentialList),
      },
      {
        path: "credentials/:id",
        loadComponent: () =>
          import("./credential-detail/credential-detail").then((m) => m.CredentialDetail),
      },
    ],
  },
  {
    path: "**",
    redirectTo: "",
  },
];
