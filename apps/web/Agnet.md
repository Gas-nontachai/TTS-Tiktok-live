# Agent.md — Tailwind-only UI, Project Structure & Theme Guidelines

## วัตถุประสงค์

ไฟล์นี้สรุปแนวทางการพัฒนา UI, การจัดโครงสร้างไฟล์ และแนวทางธีมของโปรเจค เพื่อให้โค้ดมีความสม่ำเสมอ อ่านง่าย แยกหน้าที่ชัดเจน ใช้ซ้ำได้ง่าย และง่ายต่อการ review

แนวทางหลักของโปรเจคคือ:

* ใช้ Tailwind CSS เป็นหลักสำหรับ UI styling
* แยก route, page, feature, layout และ UI component ให้ชัดเจน
* ใช้ component ซ้ำแทนการ copy class ยาว ๆ
* รักษา visual style ให้อยู่ในธีมเดียวกัน
* หลีกเลี่ยงการ over-engineer โดยไม่จำเป็น

---

## ข้อกำหนดทั่วไปด้าน Styling

* ห้ามเพิ่มหรือแก้ไขไฟล์ `.css` ใด ๆ เช่น global CSS หรือ CSS module สำหรับสไตลิงหลักของ UI
* ทุกสไตลิงให้ทำด้วย Tailwind utilities หรือ class composition ภายใน component
* หากต้องการรวม class ตามเงื่อนไข ให้ใช้ helper เช่น `clsx` หรือ `cn()`
* ห้ามย้ายสไตลิงหลักไปเป็นไฟล์ CSS ใหม่
* หลีกเลี่ยง inline style ยกเว้นกรณีจำเป็นจริง ๆ เช่น dynamic value ที่ Tailwind จัดการไม่ได้
* หลีกเลี่ยงการใช้ค่าสีแบบสุ่มในแต่ละหน้า ให้ใช้ theme token หรือ Tailwind class ที่กำหนดร่วมกัน

---

## Theme Guidelines

ธีมหลักของโปรเจคใช้โทน **Muted Sage / Natural Soft UI**
ให้ความรู้สึกเรียบ นุ่ม สบายตา เป็นธรรมชาติ และไม่ฉูดฉาด

### Color Palette

อ้างอิงจากภาพธีม:

```txt
Dark Sage    #7B8B75
Soft Sage    #A6BE9E
Warm Beige   #D9CBB9
Cream        #F6F0E6
```

### Theme Tokens ที่แนะนำ

```ts
export const theme = {
  colors: {
    primary: "#7B8B75",
    primarySoft: "#A6BE9E",
    surface: "#F6F0E6",
    surfaceMuted: "#D9CBB9",
    text: "#2F352E",
    textMuted: "#6F756A",
    border: "#D9CBB9",
  },
};
```

### การใช้สีใน UI

แนวทางการใช้สี:

* `primary` ใช้กับปุ่มหลัก, active state, selected state
* `primarySoft` ใช้กับ hover, secondary background, badge หรือ highlight อ่อน ๆ
* `surface` ใช้เป็น background หลักของ card/page
* `surfaceMuted` ใช้กับ border, divider, section background
* `text` ใช้กับข้อความหลัก
* `textMuted` ใช้กับ description, hint, secondary text

ตัวอย่าง Tailwind class ที่แนะนำ:

```tsx
<div className="rounded-xl border border-[#D9CBB9] bg-[#F6F0E6] text-[#2F352E]">
  ...
</div>
```

สำหรับ component ที่ใช้ซ้ำบ่อย ควรรวม theme class ไว้ใน component variant แทนการ copy class เดิมหลายที่

---

## Theme Usage Rules

* หลีกเลี่ยงการใช้สีสดจัด เช่น red, blue, purple เป็นสีหลักของ UI
* ถ้าต้องใช้สีแจ้งเตือน เช่น success, warning, error ให้ใช้เฉพาะจุดที่จำเป็น
* สีหลักของ interactive state ควรอิงจาก sage palette
* Card, panel, container ควรใช้พื้นหลังโทน cream หรือ beige
* Border ควรใช้สีอ่อน ไม่เข้มเกินไป
* Shadow ควรใช้แบบนุ่ม เช่น `shadow-sm` หรือ `shadow-md`
* Radius ควรใช้ `rounded-xl` หรือ `rounded-2xl` เพื่อให้ UI ดู soft
* Focus state ต้องยังมองเห็นชัดเจน เช่น `focus:ring-2 focus:ring-[#7B8B75]`

---

## โครงสร้างไฟล์ที่แนะนำ

```txt
src/
  app/
    routes/
      index.tsx
      dashboard.tsx
      alerts.tsx
      chat.tsx
      settings.tsx

  pages/
    DashboardPage.tsx
    AlertsPage.tsx
    ChatPage.tsx
    SettingsPage.tsx

  features/
    alerts/
      components/
        AlertItem.tsx
        AlertPreview.tsx
        AlertList.tsx
      hooks/
        useAlerts.ts
      services/
        alertService.ts
      types.ts
      constants.ts

    chat/
      components/
        ChatBox.tsx
        ChatMessageItem.tsx
      hooks/
        useLiveChat.ts
      services/
        chatService.ts
      types.ts

    settings/
      components/
        ThemePreview.tsx
        ConfigForm.tsx
      hooks/
        useSettings.ts
      services/
        settingsService.ts
      types.ts

  components/
    ui/
      Button.tsx
      Toggle.tsx
      Input.tsx
      Card.tsx
      Badge.tsx
      CopyRow.tsx

    layout/
      AppLayout.tsx
      Sidebar.tsx
      Header.tsx
      PageContainer.tsx

  lib/
    cn.ts
    utils.ts
    theme.ts

  services/
    apiClient.ts

  types/
    common.ts
```

---

## Guideline การแยก Folder

### `src/app/routes/`

ใช้สำหรับประกาศ route เท่านั้น

ไฟล์ใน folder นี้ควรทำหน้าที่หลัก ๆ คือ:

* map path ไปยัง page
* import page component
* handle route loader ถ้ามี
* ไม่ควรมี UI logic เยอะ
* ไม่ควรเขียน layout ใหญ่ ๆ โดยตรงใน route ถ้าแยกไป component ได้

ตัวอย่าง:

```tsx
import AlertsPage from "@/pages/AlertsPage";

export default function AlertsRoute() {
  return <AlertsPage />;
}
```

---

### `src/pages/`

ใช้สำหรับ page-level component

Page คือจุดรวมของแต่ละหน้าจอ เช่น Dashboard, Alerts, Chat, Settings

หน้าที่ของ page:

* วาง layout ภายในหน้านั้น
* ประกอบ feature components เข้าด้วยกัน
* เรียก hook ของ feature ได้
* ไม่ควรมี UI component ย่อยยาว ๆ ฝังอยู่ในไฟล์เดียวกันมากเกินไป

ตัวอย่าง:

```tsx
export default function AlertsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Alerts</h1>
      <AlertPreview />
      <AlertList />
    </div>
  );
}
```

---

### `src/features/<feature>/`

ใช้สำหรับ logic และ component ที่ผูกกับ feature นั้นโดยเฉพาะ

ตัวอย่าง feature:

```txt
features/
  alerts/
  chat/
  tts/
  settings/
```

ภายใน feature สามารถมี:

```txt
components/
hooks/
services/
types.ts
constants.ts
```

แนวทาง:

* ถ้า component ใช้เฉพาะ feature นั้น ให้เก็บใน `features/<feature>/components/`
* ถ้า hook ใช้เฉพาะ feature นั้น ให้เก็บใน `features/<feature>/hooks/`
* ถ้า API/service ใช้เฉพาะ feature นั้น ให้เก็บใน `features/<feature>/services/`
* ถ้า type ใช้เฉพาะ feature นั้น ให้เก็บใน `features/<feature>/types.ts`
* ถ้า constant ใช้เฉพาะ feature นั้น ให้เก็บใน `features/<feature>/constants.ts`

---

### `src/components/ui/`

ใช้สำหรับ UI component ขนาดเล็ก ใช้ซ้ำได้หลายที่ และไม่ผูกกับ business logic

ตัวอย่าง:

* `Button`
* `Toggle`
* `Input`
* `Card`
* `Modal`
* `Badge`
* `CopyRow`
* `Metric`

ข้อกำหนด:

* ไม่ควรรู้จัก business domain เช่น alert, TikTok, chat, user
* ควรรับ props กลาง ๆ
* ควรรองรับ `className`
* ควรรองรับ accessibility ที่เหมาะสม
* ควรใช้ theme เดียวกันกับระบบ

---

### `src/components/layout/`

ใช้สำหรับ layout กลางของระบบ

ตัวอย่าง:

* `AppLayout`
* `Sidebar`
* `Header`
* `PageContainer`
* `ContentLayout`

ใช้เมื่อต้องมี layout ซ้ำหลายหน้า เช่น sidebar, header, content wrapper

---

### `src/lib/`

ใช้สำหรับ helper ทั่วไปที่ไม่ใช่ business logic

ตัวอย่าง:

* `cn.ts`
* `theme.ts`
* `formatDate.ts`
* `formatNumber.ts`
* `storage.ts`

---

### `src/services/`

ใช้สำหรับ service กลาง เช่น API client หรือ shared request helper

ตัวอย่าง:

* `apiClient.ts`
* `http.ts`
* `socketClient.ts`

ถ้า service ผูกกับ feature เดียว ให้เก็บใน `features/<feature>/services/` แทน

---

## Import Path Guidelines

* ใช้ path alias เช่น `@/components/ui/Button`
* หลีกเลี่ยง relative path ยาว ๆ เช่น `../../../components/ui/Button`
* Import จาก layer ที่เหมาะสมและชัดเจน
* หลีกเลี่ยงการ import ข้าม feature โดยตรง ถ้าไม่จำเป็น
* ถ้าของบางอย่างถูกใช้ร่วมกันหลาย feature ให้ย้ายไป `components`, `lib`, `services` หรือ `types`

---

## การตั้งชื่อไฟล์และ Component

* ใช้ PascalCase สำหรับ React component
  เช่น `Toggle.tsx`, `AlertItem.tsx`, `ChatBox.tsx`

* ใช้ camelCase สำหรับ hooks, services, utilities
  เช่น `useAlerts.ts`, `alertService.ts`, `formatDate.ts`

* ชื่อ page ให้ลงท้ายด้วย `Page`
  เช่น `DashboardPage.tsx`, `SettingsPage.tsx`

* ชื่อ layout ให้ลงท้ายด้วย `Layout` ถ้าเป็น layout หลัก
  เช่น `AppLayout.tsx`, `AuthLayout.tsx`

* ชื่อ hook ต้องขึ้นต้นด้วย `use`
  เช่น `useLiveChat.ts`, `useSettings.ts`

---

## การ Export

สำหรับ component ทั่วไปให้ใช้ `export default` เพื่อ import ได้ง่าย

```tsx
export default function Toggle() {
  return <button />;
}
```

สำหรับ utility, type, constant สามารถใช้ named export ได้

```ts
export function cn() {}

export type AlertConfig = {};
```

---

## API มาตรฐานของ UI Component

ทุก component ใน `src/components/ui/` ควรรองรับ props พื้นฐานตามความเหมาะสม:

```ts
type Props = {
  className?: string;
  disabled?: boolean;
};
```

ถ้าเป็น interactive component ควรรองรับ event props เช่น:

* `onClick`
* `onChange`
* `onSubmit`
* `onOpenChange`

และควรมี accessibility attributes ที่เหมาะสม เช่น:

* `aria-label`
* `aria-pressed`
* `aria-expanded`
* `role`
* keyboard focus state ด้วย Tailwind เช่น `focus:outline-none focus:ring-2`

---

## Variants และ Helper Patterns

ถ้า component มีหลายรูปแบบ เช่น button variant หรือ size ให้รวม logic ไว้ใน component นั้น

ตัวอย่าง:

```tsx
const buttonVariants = {
  primary:
    "bg-[#7B8B75] text-white hover:bg-[#6E7F68] focus:ring-[#7B8B75]",
  secondary:
    "bg-[#A6BE9E] text-[#2F352E] hover:bg-[#96AE8F] focus:ring-[#7B8B75]",
  ghost:
    "bg-transparent text-[#2F352E] hover:bg-[#D9CBB9]/50 focus:ring-[#7B8B75]",
};
```

แนวทาง:

* หลีกเลี่ยงการกระจาย class ยาว ๆ ซ้ำในหลายหน้า
* ถ้า style ถูกใช้ซ้ำหลายครั้ง ให้ทำเป็น component หรือ variant
* ถ้าเป็น UI primitive ให้เก็บใน `components/ui`
* ถ้าเป็น feature-specific style ให้เก็บใน feature component

---

## Layout และ Spacing

ใช้ Tailwind utilities สำหรับ layout และ spacing เช่น:

```tsx
<div className="space-y-4">
<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
<div className="flex items-center justify-between gap-3">
```

แนวทาง:

* ใช้ `space-y-*` สำหรับ vertical spacing ภายใน section
* ใช้ `gap-*` สำหรับ flex/grid
* ใช้ `w-full`, `max-w-*`, `min-h-*` สำหรับควบคุมขนาด
* ไม่สร้าง class CSS ใหม่ เช่น `.form-grid` ในไฟล์ CSS
* ถ้าต้องใช้ layout pattern ซ้ำ ให้สร้าง component เช่น `PageContainer`, `SectionCard`, `FormRow`

---

## Route / Page / Feature Responsibility

ให้แยกหน้าที่ตามนี้:

### Route

ควรทำแค่:

* map route ไป page
* handle route loader ถ้ามี
* ไม่ควรมี UI ยาว ๆ

### Page

ควรทำ:

* วางโครงหน้าจอ
* รวม feature components
* จัด section หลักของหน้า
* เรียก feature hooks ได้

### Feature Component

ควรทำ:

* UI และ logic เฉพาะ feature
* แสดงข้อมูลของ feature
* รับ props จาก page หรือเรียก hook ของตัวเอง

### UI Component

ควรทำ:

* UI กลาง
* reusable
* ไม่ผูกกับ business logic
* ไม่เรียก API เอง

---

## State Management Guidelines

* ใช้ local state สำหรับ state ที่ใช้เฉพาะ component เดียว
* ใช้ custom hook ใน feature สำหรับ state/logic ที่ใช้ร่วมกันใน feature
* ใช้ global store เฉพาะ state ที่ต้องแชร์หลายหน้า เช่น auth, user, app config
* หลีกเลี่ยงการใส่ทุก state ลง global store โดยไม่จำเป็น
* ถ้า state เริ่มซับซ้อน ให้แยก logic ออกเป็น hook ก่อนสร้าง store ใหม่

---

## API & Data Fetching Guidelines

* API client กลางให้เก็บใน `src/services/apiClient.ts`
* API ที่ผูกกับ feature ให้เก็บใน `src/features/<feature>/services/`
* ห้ามเรียก `fetch` หรือ `axios` ตรง ๆ ใน `components/ui`
* Page หรือ feature hook ควรเป็นคนเรียก service
* แยก request/response type ไว้ใน `types.ts` ของ feature หรือ shared type
* UI component ไม่ควรรู้ endpoint หรือ API payload โดยตรง

---

## Form Guidelines

* Form logic ควรอยู่ใน page หรือ feature component
* Reusable input เช่น `Input`, `Textarea`, `Select`, `Checkbox` ให้เก็บใน `components/ui`
* Validation schema ให้แยกออกจาก JSX ถ้าเริ่มซับซ้อน
* หลีกเลี่ยงการเขียน form field ซ้ำ ๆ ถ้าสามารถแยกเป็น component ได้
* Error message ควรแสดงใกล้ field ที่เกี่ยวข้อง
* Disabled/loading state ต้องแสดงให้ผู้ใช้เข้าใจได้

---

## Simplicity / Do Not Over-engineer

* อย่าสร้าง abstraction ล่วงหน้าถ้ายังไม่มีการใช้ซ้ำจริง
* ถ้า component ใช้แค่ที่เดียวและยังไม่ซับซ้อน สามารถวางไว้ใน page หรือ feature ก่อนได้
* แยกไฟล์เมื่อ component เริ่มยาว อ่านยาก หรือถูกใช้ซ้ำ
* หลีกเลี่ยงการสร้าง folder/file เปล่าที่ไม่มีการใช้งาน
* เลือกโครงสร้างที่ง่ายที่สุดแต่ยังอ่านและดูแลต่อได้
* อย่าเพิ่ม library ใหม่ถ้า Tailwind หรือ React ปกติทำได้อยู่แล้ว

---

## ตัวอย่างการแยกที่ดี

```txt
routes/alerts.tsx
  → pages/AlertsPage.tsx
    → features/alerts/components/AlertPreview.tsx
    → features/alerts/components/AlertList.tsx
      → components/ui/Card.tsx
      → components/ui/Button.tsx
      → components/ui/Toggle.tsx
```

แนวคิดคือ:

* route ไม่รู้รายละเอียด UI
* page รู้ว่าจะใช้ feature ไหน
* feature รู้ business logic ของตัวเอง
* ui component เป็นของกลาง

---

## ตัวอย่าง Toggle State Button

Component:

```txt
src/components/ui/Toggle.tsx
```

ควรรับ props:

```ts
type ToggleProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  activeText?: string;
  inactiveText?: string;
  disabled?: boolean;
  className?: string;
};
```

การใช้งาน:

```tsx
<Toggle
  label="Enable TTS"
  checked={config.tts.enabled}
  onChange={(value) => patchConfig({ tts: { enabled: value } })}
/>
```

แนวทางการแสดงผล:

* เป็นปุ่มเดียว ไม่ใช่ switch
* ใช้สีเพื่อบอกสถานะ active/inactive
* ใช้ `aria-pressed`
* รองรับ disabled
* รองรับ focus ring
* ใช้สี active จาก theme เช่น `#7B8B75`

---

## สิ่งที่ควรหลีกเลี่ยง

* เขียน UI ยาว ๆ ทั้งหมดใน route file
* เขียน business logic ใน `components/ui`
* สร้างไฟล์ `.css` ใหม่เพื่อแก้ spacing หรือ layout เล็ก ๆ
* copy class ยาว ๆ ซ้ำหลายจุด
* ตั้งชื่อ component กว้างเกินไป เช่น `Item.tsx`, `Box.tsx`
* เอา component ที่ใช้เฉพาะ feature ไปไว้ใน `components/ui`
* เอา reusable UI component ไปฝังใน feature โดยไม่จำเป็น
* ใช้สีมั่วในแต่ละหน้าโดยไม่อิง theme
* สร้าง global state โดยไม่มีเหตุผลชัดเจน

---

## PR / Review Checklist

* ไม่มีไฟล์ `.css` ใหม่หรือแก้ไขเพื่อ styling หลัก
* Styling ใช้ Tailwind utilities หรือ component variants
* สี UI อิงจาก theme palette
* Route file ไม่ได้มี UI logic เยอะเกินไป
* Page component ทำหน้าที่ประกอบหน้า ไม่ใช่เก็บทุกอย่างไว้ในไฟล์เดียว
* Component ที่ใช้ซ้ำถูกย้ายไปไว้ใน `src/components/ui/`
* Component ที่ผูกกับ feature อยู่ใน `src/features/<feature>/`
* UI component รองรับ `className`
* Interactive component มี accessibility ที่เหมาะสม
* ไม่มี duplicated class pattern ที่ควรแยกเป็น component
* ตั้งชื่อไฟล์และ component สื่อความหมาย
* ไม่มี abstraction หรือ folder เปล่าที่ไม่จำเป็น

---

## README สั้นสำหรับ `src/components/`

แนะนำให้เพิ่ม `src/components/README.md` เพื่อสรุป convention สั้น ๆ เช่น:

```md
# Components Guidelines

- `ui/` เก็บ reusable UI primitive เช่น Button, Input, Toggle, Card
- `layout/` เก็บ layout กลาง เช่น AppLayout, Sidebar, Header
- Feature-specific components ให้เก็บใน `src/features/<feature>/components`
- ทุก UI component ควรรองรับ `className`
- Styling ใช้ Tailwind เท่านั้น
- ห้ามสร้าง CSS file ใหม่สำหรับ styling หลัก
- UI หลักควรใช้ธีม Muted Sage / Natural Soft UI
```

---

ไฟล์นี้สามารถแก้ไขหรือขยายได้ตามความต้องการของโปรเจค โดยควรรักษาหลักสำคัญคือ แยก route, page, feature, layout และ ui component ให้ชัดเจน ใช้ Tailwind CSS เป็นแหล่ง styling หลัก และรักษา visual style ให้อยู่ในธีมเดียวกันทั้งระบบ
# UI Stack Update

This project now uses Tailwind CSS plus shadcn/ui-style primitives for shared UI.

* Start new reusable UI with shadcn/ui-style primitives in `src/components/ui/`.
* Export shared primitives from `src/components/ui/index.ts`.
* Keep project-specific wrappers in `src/components/ui/` only when they preserve repeated app APIs such as `TextInput`, `NumberInput`, `Toggle`, `Metric`, or `CopyRow`.
* Keep feature-specific components outside `components/ui`.
* Use Tailwind theme tokens and the existing muted sage palette when adapting shadcn components.
