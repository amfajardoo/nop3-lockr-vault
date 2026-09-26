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
        path: "credentials/new",
        loadComponent: () =>
          import("./credential-form/credential-form").then((m) => m.CredentialForm),
      },
      {
        path: "credentials/:id/edit",
        loadComponent: () =>
          import("./credential-form/credential-form").then((m) => m.CredentialForm),
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
