/** /evaluation/report-cards/logo: the logo printed on report cards, shown on the settings page. */
import { apiDownload } from '../../../../../lib/api';

export async function GET() {
  return apiDownload('/report-card-settings/logo');
}
