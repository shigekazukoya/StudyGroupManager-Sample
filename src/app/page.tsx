import { StudyGroupManager } from "@/components/study-group-manager";  // v0で作成したコンポーネントの例

export default function HomePage() {
  return (
    <div>
      {/* ShadcnのCardコンポーネントを使用してレイアウト */}
        <StudyGroupManager /> {/* v0で作ったコンポーネントを表示 */}
    </div>
  );
}