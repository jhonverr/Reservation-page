export const isHiddenPerformance = (perf) => {
    if (!perf) return false;
    return perf.is_deleted === true || perf.is_deleted === 'true' || Boolean(perf.deleted_at);
};

export const isVisiblePerformance = (perf) => !isHiddenPerformance(perf);
