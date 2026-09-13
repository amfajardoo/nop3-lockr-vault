import { Component, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { MockDataService } from "../../vault/vault.service";
import { VaultStore } from "../../vault/vault.store";
import { CredentialDetail } from "./credential-detail";

const routeParam = { current: "00000000-0000-4000-8000-000000000099" };

function provideRouteParam(): { provide: typeof ActivatedRoute; useValue: unknown } {
  return {
    provide: ActivatedRoute,
    useValue: { snapshot: { paramMap: { get: () => routeParam.current } } },
  };
}

@Component({
  selector: "credential-detail-story-valid",
  imports: [CredentialDetail],
  providers: [provideRouteParam()],
  template: "<credential-detail />",
})
class ValidStory {
  constructor() {
    const store = inject(VaultStore);
    if (store.count() === 0) {
      for (const seed of inject(MockDataService).getSeedCredentials()) {
        store.add(seed);
      }
    }
    routeParam.current = store.credentials()[0]?.id ?? routeParam.current;
  }
}

@Component({
  selector: "credential-detail-story-unknown",
  imports: [CredentialDetail],
  providers: [provideRouteParam()],
  template: "<credential-detail />",
})
class UnknownStory {}

export const Valid = ValidStory;
export const Unknown = UnknownStory;
