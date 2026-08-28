import { SkeletonRows } from "../components/Skeleton";
import { ResizablePanel, ResizablePanelGroup } from "../components/ui/resizable";
import { useAppStore } from "../store";
import { resolveLayoutPreset } from "./layout";

function SkeletonStrip() {
	return (
		<div className="flex h-panel-header-row shrink-0 items-center border-border-default border-b px-8">
			<span className="h-3 w-24 animate-pulse rounded-[var(--radius-sm)] bg-control-bg-hovered" />
		</div>
	);
}

function SkeletonSidePane() {
	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden bg-container-sidebar-bg">
			<SkeletonStrip />
			<div className="p-12">
				<SkeletonRows rows={6} />
			</div>
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
					<div className="flex h-full min-h-0 flex-col overflow-hidden bg-container-content-bg">
						<SkeletonStrip />
						<div className="p-16">
							<SkeletonRows rows={12} />
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
