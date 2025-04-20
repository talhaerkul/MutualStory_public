export const dateHelper = {
  toISOString: (date: Date = new Date()) => date.toISOString(),
  fromISOString: (dateString: string) => new Date(dateString),
  formatDate: (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "-";
    }
  },
};
