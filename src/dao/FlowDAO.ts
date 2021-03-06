import {IHasHTTP} from '../api/IHasHTTP';
import {IOnmsHTTP} from '../api/IOnmsHTTP';
import {OnmsError} from '../api/OnmsError';
import {OnmsFlowSeries} from '../model/OnmsFlowSeries';
import {OnmsFlowSeriesColumn} from '../model/OnmsFlowSeriesColumn';
import {OnmsFlowExporterSummary} from '../model/OnmsFlowExporterSummary';
import {OnmsFlowSnmpInterface} from '../model/OnmsFlowSnmpInterface';
import {OnmsFlowExporter} from '../model/OnmsFlowExporter';
import {OnmsFlowTable} from '../model/OnmsFlowTable';
import {OnmsHTTPOptions} from '../api/OnmsHTTPOptions';

import {BaseDAO} from './BaseDAO';

/** @hidden */
// tslint:disable-next-line
const moment = require('moment');

/** @hidden */
// tslint:disable-next-line
import {Moment} from 'moment';

/**
 * DAO for accessing flow (Netflow/IPFIX/sFlow) data.
 * @module FlowDAO
 */
export class FlowDAO extends BaseDAO {
    /**
     * Create an [[OnmsHTTPOptions]] object for DAO calls.
     */
    protected static async getOptions(): Promise<OnmsHTTPOptions> {
        return Promise.resolve(new OnmsHTTPOptions())
            .then((options) => {
                options.headers.accept = 'application/json';
                return options;
            });
    }

    /**
     * Get a summary of the nodes that have exported flows.
     * @param limit - maximum number of exporters to return (those with the most flows will be returned
     *                if the results are truncated)
     * @param start - the start of the timespan to query (defaults to 4 hours ago)
     * @param end - the end of the timespan to query (defaults to now)
     */
    public async getExporters(limit: number, start?: number, end?: number): Promise<OnmsFlowExporterSummary[]> {
        return FlowDAO.getOptions().then((opts) => {
            const url = this.pathToFlowsEndpoint() + '/exporters';
            opts.withParameter('limit', limit)
                .withParameter('start', start)
                .withParameter('end', end);
            return this.http.get(url, opts).then((result) => {
                if (result && result.data) {
                    if (!Array.isArray(result.data)) {
                        throw new OnmsError('Expected an array of flow exporter summaries but got "' +
                            (typeof result) + '" instead.');
                    }
                    return result.data.map((exporter) => {
                        return this.toFlowExporterSummary(exporter);
                    });
                }
                throw new OnmsError('Unexpected response from GET ' + url + ': no result data found.');
            });
        });
    }

    /**
     * Get detailed information about a specific node.
     * @param criteria - the node ID or foreignSource:foreignId tuple
     * @param limit - maximum number of interfaces to return (those with the most flows will be returned
     *                if the results are truncated)
     * @param start - the start of the timespan to query (defaults to 4 hours ago)
     * @param end - the end of the timespan to query (defaults to now)
     */
    public async getExporter(criteria: string, limit: number, start?: number, end?: number): Promise<OnmsFlowExporter> {
        return FlowDAO.getOptions().then((opts) => {
            opts.withParameter('limit', limit)
                .withParameter('start', start)
                .withParameter('end', end);
            return this.http.get(this.pathToFlowsEndpoint() + '/exporters/' + criteria, opts).then((result) => {
                return this.toFlowExporter(result.data);
            });
        });
    }

    /**
     * Summarize the top N applications/protocols based on parameters.
     * @param N - how many applications to return
     * @param start - the start of the timespan to query (defaults to 4 hours ago)
     * @param end - the end of the timespan to query (defaults to now)
     * @param includeOther - include an additional "other" result that
     *                       represents everything that does not match the top N
     * @param exporterNodeCriteria - the node ID or foreignSource:foreignId tuple
     * @param ifIndex - filter for flows that came through this SNMP interface
     */
    public async getSummaryForTopNApplications(N?: number, start?: number, end?: number,
                                               includeOther?: boolean,
                                               exporterNodeCriteria?: string,
                                               ifIndex?: number): Promise<OnmsFlowTable> {
        return FlowDAO.getOptions().then((opts) => {
            opts.withParameter('N', N)
                .withParameter('start', start)
                .withParameter('end', end)
                .withParameter('exporterNode', exporterNodeCriteria)
                .withParameter('ifIndex', ifIndex)
                .withParameter('includeOther', includeOther);
            return this.http.get(this.pathToFlowsEndpoint() + '/applications', opts).then((result) => {
                return this.tableFromData(result.data);
            });
        });
    }

    /**
     * Summarize the top N conversations based on parameters.
     * @param N - how many conversations to return
     * @param start - the start of the timespan to query (defaults to 4 hours ago)
     * @param end - the end of the timespan to query (defaults to now)
     * @param exporterNodeCriteria - the node ID or foreignSource:foreignId tuple
     * @param ifIndex - filter for flows that came through this SNMP interface
     */
    public async getSummaryForTopNConversations(N?: number, start?: number, end?: number,
                                                exporterNodeCriteria?: string,
                                                ifIndex?: number): Promise<OnmsFlowTable> {
        return FlowDAO.getOptions().then((opts) => {
            opts.withParameter('N', N)
                .withParameter('start', start)
                .withParameter('end', end)
                .withParameter('exporterNode', exporterNodeCriteria)
                .withParameter('ifIndex', ifIndex);
            return this.http.get(this.pathToFlowsEndpoint() + '/conversations', opts).then((result) => {
                return this.tableFromData(result.data);
            });
        });
    }

    /**
     * Get time series data for the top N applications/protocols based on parameters.
     * @param N - how many applications' series to return
     * @param start - the start of the timespan to query (defaults to 4 hours ago)
     * @param end - the end of the timespan to query (defaults to now)
     * @param step - the requested time interval between rows
     * @param includeOther - include an additional "other" result that
     *                       represents everything that does not match the top N
     * @param exporterNodeCriteria - the node ID or foreignSource:foreignId tuple
     * @param ifIndex - filter for flows that came through this SNMP interface
     */
    public async getSeriesForTopNApplications(N?: number, start?: number, end?: number,
                                              step?: number, includeOther?: boolean,
                                              exporterNodeCriteria?: string,
                                              ifIndex?: number): Promise<OnmsFlowSeries> {
        return FlowDAO.getOptions().then((opts) => {
            opts.withParameter('N', N)
                .withParameter('start', start)
                .withParameter('end', end)
                .withParameter('step', step)
                .withParameter('exporterNode', exporterNodeCriteria)
                .withParameter('ifIndex', ifIndex)
                .withParameter('includeOther', includeOther);
            return this.http.get(this.pathToFlowsEndpoint() + '/applications/series', opts).then((result) => {
                return this.seriesFromData(result.data);
            });
        });
    }

    /**
     * Get time series data for the top N conversations based on parameters.
     * @param N - how many conversations' series to return
     * @param start - the start of the timespan to query (defaults to 4 hours ago)
     * @param end - the end of the timespan to query (defaults to now)
     * @param step - the requested time interval between rows
     * @param exporterNodeCriteria - the node ID or foreignSource:foreignId tuple
     * @param ifIndex - filter for flows that came through this SNMP interface
     */
    public async getSeriesForTopNConversations(N?: number, start?: number, end?: number,
                                               step?: number, exporterNodeCriteria?: string,
                                               ifIndex?: number): Promise<OnmsFlowSeries> {
        return FlowDAO.getOptions().then((opts) => {
            opts.withParameter('N', N)
                .withParameter('start', start)
                .withParameter('end', end)
                .withParameter('step', step)
                .withParameter('exporterNode', exporterNodeCriteria)
                .withParameter('ifIndex', ifIndex);
            return this.http.get(this.pathToFlowsEndpoint() + '/conversations/series', opts).then((result) => {
                return this.seriesFromData(result.data);
            });
        });
    }

    /**
     * Convert flow ReST exporter summary JSON data to an [[OnmsFlowExporterSummary]] object.
     * @hidden
     */
    public toFlowExporterSummary(data: any) {
        const summary = new OnmsFlowExporterSummary();
        summary.id = data.id;
        summary.foreignId = data.foreignId;
        summary.foreignSource = data.foreignSource;
        summary.label = data.label;
        return summary;
    }

    /**
     * Convert flow ReST exporter JSON data to an [[OnmsFlowExporter]] object.
     * @hidden
     */
    public toFlowExporter(data: any) {
        const exporter = new OnmsFlowExporter();
        exporter.id = data.id;
        exporter.foreignId = data.foreignId;
        exporter.foreignSource = data.foreignSource;
        exporter.label = data.label;
        exporter.interfaces = [];
        if (data.interface) {
            exporter.interfaces = data.interface.map((iff) => {
               return this.toInterface(iff);
            });
        }
        return exporter;
    }

    /**
     * Convert flow ReST interface JSON data to an [[OnmsFlowSnmpInterface]] object.
     * @hidden
     */
    public toInterface(data: any) {
        const iff = new OnmsFlowSnmpInterface();
        iff.index = data.index;
        iff.name = data.name;
        iff.description = data.descr;
        iff.resourceId = data['resource-id'];
        return iff;
    }

    /**
     * Create a series object from a JSON object.
     * @hidden
     */
    public tableFromData(data: any) {
        const table = new OnmsFlowTable();

        table.start = this.toDate(data.start);
        table.end = this.toDate(data.end);
        table.headers = data.headers;
        table.rows = data.rows;

        return table;
    }

    /**
     * Create a series object from a JSON object.
     * @hidden
     */
    public seriesFromData(data: any) {
        const series = new OnmsFlowSeries();

        series.start = this.toDate(data.start);
        series.end = this.toDate(data.end);
        series.columns = data.labels;
        series.timestamps = data.timestamps;
        series.values = data.values;

        let columns = data.columns;
        if (!Array.isArray(columns)) {
            columns = [columns];
        }
        series.columns = [];

        for (let column of columns) {
            column = new OnmsFlowSeriesColumn(
                column.label,
                column.ingress,
            );
            series.columns.push(column);
        }

        return series;
    }

    /**
     * Get the path to the flows endpoint for the appropriate API version.
     * @hidden
     */
    private pathToFlowsEndpoint() {
        return 'rest/flows';
    }
}
