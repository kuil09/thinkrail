import { ResizablePanel, ResizablePanelGroup } from "../components/ui/resizable";
import { useAppStore } from "../store";
import { resolveLayoutPreset } from "./layout";

function SkeletonStrip() {
	return (
		<div className="flex h-panel-header-row shrink-0 items-center border-border-default border-b px-sm">
			<span className="h-3 w-24 animate-pulse rounded-[var(--radius-sm)] bg-control-bg-hovered" />
		</div>
	);
}

const SKELETON_ROW_WIDTHS = ["w-3/4", "w-2/3", "w-4/5", "w-1/2", "w-3/5", "w-2/3"] as const;

function SkeletonRows({ rows }: { rows: number }) {
	return (
		<div className="flex flex-col gap-sm p-md">
			{SKELETON_ROW_WIDTHS.slice(0, rows).map((width) => (
				<span
					key={width}
					className={`h-3 animate-pulse rounded-[var(--radius-sm)] bg-control-bg-hovered ${width}`}
				/>
			))}
		</div>
	);
}

function SkeletonSidePane() {
	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden bg-container-sidebar-bg">
			<SkeletonStrip />
			<SkeletonRows rows={6} />
		</div>
	);
}

export function WorkbenchSkeleton() {
	const layoutSettings = useAppStore((state) => state.layoutSettings);
	const preset = resolveLayoutPreset(layoutSettings.defaultPresetId, layoutSettings.customPresets);
	const leftSize = preset.left.visible ? preset.left.width * 100 : 0;
	const rightSize = preset.right.visible ? preset.right.width * 100 : 0;
	return (
		<div
			data-testid="workspace-restoring"
			role="status"
			aria-label="Restoring workspace layout"
			aria-busy="true"
			className="h-full min-h-0 min-w-0"
		>
			<ResizablePanelGroup direction="horizontal" className="min-h-0 min-w-0">
				{preset.left.visible ? (
					<ResizablePanel id="skeleton-left" order={1} defaultSize={leftSize}>
						<SkeletonSidePane />
					</ResizablePanel>
				) : null}
				<ResizablePanel
					id="skeleton-center"
					order={2}
					defaultSize={100 - leftSize - rightSize}
					className="border-border-default border-x"
				>
					<div className="flex h-full min-h-0 flex-col bg-container-content-bg">
						<SkeletonStrip />
						<div className="flex flex-1 items-center justify-center">
							<span className="tr-text-ui text-text-muted">Restoring workspace…</span>
						</div>
					</div>
				</ResizablePanel>
				{preset.right.visible ? (
					<ResizablePanel id="skeleton-right" order={3} defaultSize={rightSize}>
						<SkeletonSidePane />
					</ResizablePanel>
				) : null}
			</ResizablePanelGroup>
		</div>
	);
}
