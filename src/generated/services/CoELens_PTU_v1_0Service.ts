/*!
 * CoELens_PTU-v1.0 — Power Automate flow service
 * Mirrors Rammas_Send_ResponseService pattern.
 */

import type { IOperationResult } from '@microsoft/power-apps/data';
import type { CoELensPTUInput, CoELensPTUOutput } from '../models/CoELens_PTU_v1_0Model';
import { dataSourcesInfo } from '../../../.power/schemas/appschemas/dataSourcesInfo';
import { getClient } from '@microsoft/power-apps/data';

export class CoELens_PTU_v1_0Service {
  private static readonly dataSourceName = 'coelens_ptu_v1_0';

  private static readonly client = getClient(dataSourcesInfo);

  public static async Run(input: CoELensPTUInput): Promise<IOperationResult<CoELensPTUOutput>> {
    const params: { input: CoELensPTUInput } = { input };
    const allParams = { ...params, 'api-version': '2015-02-01-preview' };
    const result = await CoELens_PTU_v1_0Service.client.executeAsync<
      { input: CoELensPTUInput },
      CoELensPTUOutput
    >({
      connectorOperation: {
        tableName: CoELens_PTU_v1_0Service.dataSourceName,
        operationName: 'Run',
        parameters: allParams,
      },
    });
    return result;
  }
}
