# liczba-z-wlasnego-ekranu-podana-odbiorcy-jako-stala

- **Skill:** live-gift
- **Typ:** porażka
- **Status:** zaadresowany (2026-09-18, live-gift)

## Opis
Instrukcja i narracja prezentu mówiły widzowi „pięć klocków ma czerwony
trójkąt". Rafał na swoim ekranie zobaczył trzy. Liczba nie była zmyślona —
tyle węzłów workflowu wymaga logowania — ale opisywała wyłącznie konto bez ani
jednego zapisanego credentiala, a tak wygląda tylko część widzów.

## Przyczyna źródłowa
Materiał dla odbiorcy pisze się z jednego środowiska: albo z pliku
(policzone węzły bez `credentials`), albo z własnego ekranu. Wielkość, która
zależy od stanu konta odbiorcy — ile logowań już miał, ile n8n zmapowało samo
przy imporcie — trafia do tekstu w trybie oznajmującym, bo w chwili pisania
istnieje tylko jedna jej wartość. Nic w procesie nie pyta „czy to samo zobaczy
ktoś inny": walidator sprawdza manifest, parser sprawdza kształt segmentów,
a instrukcji i narracji nikt nie porównuje z drugim kontem.

## Dowody
- 2026-09-18, sesja fe0e2a4e (id claude.ai niedostępny): prezent „Poranny
  asystent dnia". W `instrukcja.md` krok 2 i w narracji segment „Import" stało
  „pięć klocków ma czerwony trójkąt". Rafał: „W moim przypadku jest 3 nody
  z czerwonym trójkątem… ile wcześniej miał credentiali i ile uda się n8n
  zaimportować automatycznie". U niego kalendarz i model zmapowały się same,
  trzy węzły Gmaila zostały czerwone. Poprawka objęła oba pliki i dołożyła
  całą sekcję o tym, skąd bierze się różnica.

## Rozwiązanie
Liczba widoczna na ekranie odbiorcy (ile trójkątów, ile pozycji na liście, ile
kroków zostało) nie wchodzi do materiału jako stała. Podajesz ją z własnego
ekranu, jawnie jako swój przypadek, mówisz wprost, że u odbiorcy będzie inaczej
i od czego to zależy, i dopiero wtedy podajesz wartość skrajną („jeśli
zaczynasz od zera — pięć"). Reguła stoi w `live-gift` SKILL.md §7, akapit „How
many triangles there are is not a constant".
